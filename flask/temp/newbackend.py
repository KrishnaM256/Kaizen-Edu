import fitz
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import base64
import io
# import fitz
from pdf2image import convert_from_bytes
from PIL import Image
import re
import json
import os
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import requests

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure APIs
EDENAI_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZmMxMGRkNDAtOGIxYS00YmUxLTllNmEtNDZjOTExYzIwYzI0IiwidHlwZSI6ImFwaV90b2tlbiJ9.UFwm-YijNasg9t0udv-aki7rr9LxetwquTPpWmNNcRg"
API_KEY = "AIzaSyA9MjZo6sIOlCQPQo5ojKBdHnGmUjlcsGc"
genai.configure(api_key=API_KEY)

# Configuration
DB_PATH = "chroma_db"
os.makedirs(DB_PATH, exist_ok=True)
SCORING_MODEL = genai.GenerativeModel('gemini-1.5-flash')


# Helper Functions
def image_to_base64(image):
    buffered = io.BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


def extract_text_from_image(image):
    try:
        img_base64 = image_to_base64(image)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([
            "Extract text exactly as written from this document. Preserve formatting and numbering.",
            {"mime_type": "image/png", "data": img_base64}
        ])
        return response.text.strip() if response else ""
    except Exception as e:
        return f"OCR Error: {str(e)}"


def process_pdf(file):
    try:
        images = convert_from_bytes(file.read())
        extracted_text = ""
        for image in images:
            text = extract_text_from_image(image)
            extracted_text += text + "\n"
        file.seek(0)
        return extracted_text
    except Exception as e:
        return f"PDF Processing Error: {str(e)}"


def process_questions(text):
    questions = re.split(r'(?=Q\d+)', text)
    indices = []
    for q in questions:
        match = re.match(r'Q(\d+)', q)
        if match: indices.append(int(match.group(1)))

    if not indices: return []

    min_idx, max_idx = min(indices), max(indices)
    questions_list = [""] * (max_idx - min_idx + 1)

    for q in questions:
        match = re.match(r'Q(\d+)', q)
        if match:
            idx = int(match.group(1)) - min_idx
            if 0 <= idx < len(questions_list):
                questions_list[idx] = q[match.end():].strip()

    return questions_list


def load_pdf(pdf_path):
    """Loads and splits a PDF into pages."""
    pdf_loader = PyPDFLoader(pdf_path)
    pages = pdf_loader.load_and_split()
    return pages


def create_or_load_db(pages):
    """Splits PDF text into smaller chunks and either creates or loads a persistent Chroma database."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=750, chunk_overlap=50)
    context = "\n\n".join(str(p.page_content) for p in pages)
    texts = text_splitter.split_text(context)

    # Create embeddings
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=API_KEY)

    # Check if ChromaDB already exists
    if os.path.exists(DB_PATH):
        print("Loading existing ChromaDB...")
        vector_index = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
    else:
        print("Creating new ChromaDB...")
        vector_index = Chroma.from_texts(texts, embeddings, persist_directory=DB_PATH)
        vector_index.persist()  # Save to disk

    return vector_index


def create_chroma_db(text):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    texts = text_splitter.split_text(text)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=API_KEY
    )

    return Chroma.from_texts(
        texts,
        embeddings,
        persist_directory=DB_PATH
    )


def get_chroma_context(query, k=3):
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=API_KEY
    )
    db = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embeddings
    )
    return db.similarity_search(query, k=k)


def evaluate_answer(question, answer, context):
    try:
        prompt = f"""Evaluate the answer strictly based on the context. Follow these rules:
        1. Score 0-10 (10=exact match, 7-9=mostly correct, 5-6=partial, 0-4=wrong)
        2. Consider spelling and technical terms
        3. Return ONLY the score as a float

        Question: {question}
        Answer: {answer}
        Context: {context[:1500]}  # Limit context length

        Score: """

        response = SCORING_MODEL.generate_content(prompt)
        score = min(10, max(0, float(response.text.strip())))
        return round(score, 1)
    except Exception as e:
        print(f"Scoring Error: {str(e)}")
        return 0.0


def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text.strip()


@app.route("/schedule", methods=["POST"])
def upload_file():
    try:
        if "file" not in request.files or "start_date" not in request.form or "end_date" not in request.form:
            return jsonify({"error": "Missing required inputs"}), 400

        file = request.files["file"]
        start_date = request.form["start_date"]
        end_date = request.form["end_date"]

        # Save and process file
        file_path = os.path.join("temp.pdf")
        file.save(file_path)
        syllabus_text = extract_text_from_pdf(file_path)
        os.remove(file_path)

        # Generate prompt
        prompt = f"""
        Generate a structured teaching schedule in JSON format.
        - Start Date: {start_date}
        - End Date: {end_date}
        - Syllabus: {syllabus_text}
        Output JSON array with: "date", "day", "topic", "hours".
        """

        # Get AI response
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        # print(response)

        if not response.text:
            return jsonify({"error": "No valid response from AI"}), 500

        cleaned_response = response.text.strip()
        # Clean response and extract JSON
        # cleaned_response = re.sub(r'json|', '', response.text)
        cleaned_response = re.sub(r"```json|```", "", cleaned_response).strip()
        json_match = re.search(r"(\{.*\}|\[.*\])", cleaned_response, re.DOTALL)
        print(cleaned_response)
        print(json_match)
        if not json_match:
            return jsonify({"error": "No JSON found in AI response"}), 500

        # Parse JSON
        schedule = json.loads(json_match.group(1))
        print(schedule)
        return jsonify({"schedule": schedule})

    except json.JSONDecodeError as e:
        return jsonify({"error": f"Invalid JSON format: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# Routes
@app.route('/get_student_score', methods=['POST'])
def evaluate_answers():
    try:
        # File handling
        answer_file = request.files.get('answersheet')
        question_file = request.files.get('question_paper')
        if not answer_file or not question_file:
            return jsonify({"error": "Missing PDF files"}), 400

        # Text extraction
        answer_text = process_pdf(answer_file)
        question_text = process_pdf(question_file)

        # Question-answer processing
        questions = process_questions(question_text)
        answers = process_questions(answer_text)
        if len(questions) != len(answers):
            return jsonify({"error": "Q/A count mismatch"}), 400

        # Create knowledge base
        create_chroma_db(question_text).persist()

        # Evaluation pipeline
        results = []
        for idx, (q, a) in enumerate(zip(questions, answers)):
            try:
                context = [doc.page_content for doc in get_chroma_context(q)]
                score = evaluate_answer(q, a, "\n".join(context))

                results.append({
                    "question_no": idx + 1,
                    "question": q,
                    "answer": a,
                    "context": context,
                    "score": score,
                    "max_score": 10.0
                })
            except Exception as e:
                print(f"Error processing Q{idx + 1}: {str(e)}")
                results.append({
                    "question_no": idx + 1,
                    "error": "Evaluation failed"
                })
        # print(results)
        print(sum(r.get('score', 0) for r in results))
        print(results)
        return jsonify({
            "total_score": sum(r.get('score', 0) for r in results),

            "results": results
        })

    except Exception as e:
        return jsonify({"error": f"System error: {str(e)}"}), 500


@app.route("/upload", methods=["POST"])
def upload_pdf():
    """API endpoint to upload a PDF and store its embeddings."""
    if "file" not in request.files:
        print("No file found in request")  # Debugging log
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    print(f"Received file: {file.filename}")  # Debugging log

    # Ensure 'uploads' directory exists
    os.makedirs("uploads", exist_ok=True)

    pdf_path = os.path.join("uploads", file.filename)
    file.save(pdf_path)

    print(f"File saved at: {pdf_path}")  # Debugging log

    # Load PDF and store embeddings
    try:
        pages = load_pdf(pdf_path)  # Ensure this function works correctly
        create_or_load_db(pages)  # Ensure this function is correctly handling the DB
    except Exception as e:
        print(f"Error processing PDF: {e}")  # Debugging log
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "PDF uploaded and stored in ChromaDB"}), 200


@app.route("/detect_ai", methods=["POST"])
def detect_ai():
    Plagchecker_API_URL = "https://api.edenai.run/v2/text/ai_detection"
    try:
        text = ""
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400

            poppler_path = 'C:/Program Files (x86)/poppler-24.08.0/Library/bin'  # Adjust if necessary
            if file.filename.endswith('.pdf'):
                images = convert_from_bytes(file.read(), poppler_path=poppler_path)
                for image in images:
                    text += extract_text_from_image(image)
            else:
                image = Image.open(file)
                text = extract_text_from_image(image)
        else:
            data = request.json
            text = data.get("text", "")

        if not text:
            return jsonify({'error': 'No text extracted or provided'}), 400

        headers = {
            "authorization": f"Bearer {EDENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "providers": "winstonai",
            "text": text
        }

        response = requests.post(Plagchecker_API_URL, json=payload, headers=headers)

        return jsonify(response.json()), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/ask_gemini", methods=["GET"])
def ask_gemini():
    """
    Sends a prompt to the Gemini API and returns the response.

    Query Parameters:
    - prompt: The complete formatted prompt including system instructions, source document, and question.
    - api_key: The API key to authenticate the request.

    Returns:
    - JSON response containing Gemini's generated text.
    """
    prompt = request.args.get("prompt")
    api_key = request.args.get("api_key")

    if not prompt or not api_key:
        return jsonify({"error": "Missing 'prompt' or 'api_key'"}), 400

    # Configure API
    genai.configure(api_key=api_key)

    # Initialize the model
    model = genai.GenerativeModel("gemini-pro")

    # Get response
    response = model.generate_content(prompt)

    return jsonify({"response": response.text})

def clean_ai_response(ai_response):
    """
    Cleans and extracts a valid JSON object from AI-generated text.

    Args:
        ai_response (str): The raw response from AI.

    Returns:
        dict: A properly formatted JSON object.
    """
    try:
        # Remove unnecessary formatting (like json ... )
        cleaned_text = re.sub(r"json\n|\n", "", ai_response).strip()

        # Parse JSON response
        quiz_data = json.loads(cleaned_text)

        # Validate structure
        required_keys = {"question", "context", "answer", "evaluation", "feedback"}
        if not required_keys.issubset(quiz_data.keys()):
            return {"error": "Invalid JSON structure received from AI"}

        return quiz_data
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format received from AI"}


@app.route('/generate-feedback', methods=['POST'])
def generate_feedback():
    """
    API endpoint to generate personalized feedback based on student responses.
    """
    data = request.json
    results = data.get("results")

    if not results:
        return jsonify({"error": "Missing required fields"}), 400

    feedback_responses = []

    for result in results:
        question = result.get("question")
        student_response = result.get("answer")

        if not question or not student_response:
            continue

        # Construct prompt for AI
        prompt = f"""
        You are an AI that generates structured JSON responses for a personalized feedback system. 
        Given the student's response to a question, provide the following details in JSON format:

        - question: The question being answered.
        - context: The original response provided by the student.
        - answer: A simplified version of the response.
        - evaluation: A short assessment of the answer's accuracy and completeness.
        - feedback: Constructive feedback to improve the response.

        eg - 

            question - What were the major causes of World War I?
            context -  World War I was caused by a combination of political tensions, military buildup, and nationalistic sentiments.
            answer - World War I started because of political tensions between nations and various alliances.
            evaluation - Partial answer: Needs more depth.
            feedback - You've identified alliances as a cause, which is a good start! However, your response could be more detailed. Try elaborating on specific alliances and other contributing factors like militarism, imperialism, and nationalism.

        Ensure the JSON output follows this structure:
        {{
          "question": "{question}",
          "context": "{student_response}",
          "answer": "Provide a simplified version of the response here.",
          "evaluation": "Provide a short assessment here.",
          "feedback": "Provide constructive feedback here."
        }}
        """

        # Get feedback from Gemini
        feedback = ask_gemini_internal(prompt, API_KEY)
        feedback_responses.append(feedback)
        # print(feedback)
        print(feedback_responses)
    return jsonify(feedback_responses)

@app.route("/ask_gemini_internal", methods=["GET"])
def ask_gemini_internal():
    prompt = request.args.get("prompt")
    api_key = request.args.get("api_key")

    if not prompt or not api_key:
        return jsonify({"error": "Missing 'prompt' or 'api_key'"}), 400

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)

    return jsonify({"response": response.text})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)