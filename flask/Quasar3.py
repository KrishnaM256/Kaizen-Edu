import fitz
from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
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
EDENAI_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZDE3YjgwYzAtNzg5ZS00YmZkLWIwOTUtMWViZGE0YjNjMjY0IiwidHlwZSI6ImFwaV90b2tlbiJ9.X6hlGB842uLh2-CWDGgmt60ucJE6gYF-pS8BS0_lvXs"
API_KEY = "AIzaSyCRPHBaZTUVv7EsYkBTDZnbOFCsrdmx7zE"
genai.configure(api_key=API_KEY)

# LMNT API key 
LMNT_API_KEY = "b41b2d1dd2494ca0a54dcf92f1a74474"
# Configuration
DB_PATH = "flask/chroma_db9"
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
        print(extracted_text + "hrllo")
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
    print(pages)
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
        prompt = f"""
Evaluate the student's answer strictly based on the provided context and the following rules:

1. **Scoring Criteria**:
   - **10/10**: The answer is completely correct, matches the context exactly, and includes all relevant details.
   - **8-9/10**: The answer is mostly correct but may have minor inaccuracies or omissions.
   - **6-7/10**: The answer is partially correct but lacks important details or contains some inaccuracies.
   - **4-5/10**: The answer is somewhat relevant but contains significant inaccuracies or omissions.
   - **0-3/10**: The answer is incorrect, irrelevant, or does not address the question.

2. **Evaluation Guidelines**:
   - Consider the accuracy of the answer in relation to the context.
   - Check for the inclusion of key terms, concepts, and details from the context.
   - Deduct points for spelling errors, grammatical mistakes, or unclear phrasing.
   - Ensure the answer is concise and directly addresses the question.

3. **Output Format**:
   - Return ONLY the score as a float between 0 and 10.

**Question**: {question}
**Student's Answer**: {answer}
**Context**: {context[:1500]}  # Limit context length to avoid token overflow

**Score**: """

        response = SCORING_MODEL.generate_content(prompt)
        # print("\n")
        # print("niggg")
        print(context)
        # print("niggg")
        # print("\n")
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
def extract_text_from_pdf12(file):
    """
    Extracts text from a PDF file object.

    Args:
        file: A file-like object (e.g., from Flask's request.files).

    Returns:
        str: The extracted text from the PDF.
    """
    text = ""
    # Use BytesIO to read the file in memory
    with BytesIO(file.read()) as pdf_file:
        # Open the PDF file using PyMuPDF
        with fitz.open(stream=pdf_file, filetype="pdf") as doc:
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
        file_path = os.path.join("temp2.pdf")
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
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt)
        print(response)

        if not response.text:
            return jsonify({"error": "No valid response from AI"}), 500

        cleaned_response = response.text.strip()
        # Clean response and extract JSON
        # cleaned_response = re.sub(r'json|', '', response.text)
        cleaned_response = re.sub(r"json|", "", cleaned_response).strip()
        # json_match = re.search(r"(\{.\}|\[.\])", cleaned_response, re.DOTALL)
        json_match = cleaned_response
        print(cleaned_response)
        print(json_match)
        # if not json_match:
        #     return jsonify({"error": "No JSON found in AI response"}), 500

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
        # print(answer_text)
        question_text = process_pdf(question_file)
        # print(question_text)

        # Question-answer processing
        questions = process_questions(question_text)
        answers = process_questions(answer_text)
        if len(questions) != len(answers):
            return jsonify({"error": "Q/A count mismatch"}), 400

        # Create knowledge base
        # create_chroma_db(question_text).persist()

        # Evaluation pipeline
        results = []
        for idx, (q, a) in enumerate(zip(questions, answers)):
            try:
                context = [doc.page_content for doc in get_chroma_context(q)]
                print("Retrieved Context:", context)
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
        # print(results)
        return jsonify({
            "total_score": sum(r.get('score', 0) for r in results),

            "results": results
        })

    except Exception as e:
        return jsonify({"error": f"System error: {str(e)}"}), 500



@app.route("/timetable", methods=["POST"])
def generate_timetable():
    try:
        # Check if required inputs are provided
        if "file" not in request.files or "start_date" not in request.form or "end_date" not in request.form:
            return jsonify({"error": "Missing required inputs: file, start_date, or end_date"}), 400

        # Get the uploaded file and date inputs
        file = request.files["file"]
        start_date = request.form["start_date"]
        end_date = request.form["end_date"]

        # Save the file temporarily
        file_path = os.path.join("temp_timetable.pdf")
        file.save(file_path)

        # Extract text from the PDF
        syllabus_text = extract_text_from_pdf(file_path)

        # Remove the temporary file
        os.remove(file_path)

        # Generate the prompt for the AI
        prompt = f"""
        Generate a structured timetable in JSON format based on the following details:
        - Start Date: {start_date}
        - End Date: {end_date}
        - Syllabus: {syllabus_text}

        The timetable should include the following fields for each entry:
        - date: The date of the session (format: YYYY-MM-DD)
        - day: The day of the week (e.g., Monday, Tuesday)
        - topic: The topic to be covered
        - hours: The number of hours allocated for the session

        If the syllabus ends before the end date, repeat hard topics from the syllabus. If there are still remaining days, add revision sessions and tests.

        Ensure the output is a valid JSON array. Do not include any comments or invalid JSON syntax.
        """

        # Get the AI response
        model = genai.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt)

        # Check if the response is valid
        if not response.text:
            return jsonify({"error": "No valid response from AI"}), 500

        # Clean the response and extract JSON
        cleaned_response = response.text.strip()

        # Remove the ```json prefix if it exists
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response[len("```json"):].strip()
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-len("```")].strip()

        # Remove any comments (e.g., // ...) from the response
        cleaned_response = re.sub(r"//.*", "", cleaned_response)

        # Debugging: Print the cleaned response
        print("Cleaned Response:", cleaned_response)

        # Parse the JSON response
        try:
            timetable = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            # Debugging: Print the exact JSON parsing error
            print(f"JSON Decode Error: {str(e)}")
            return jsonify({"error": f"Invalid JSON format in AI response: {str(e)}"}), 500

        # Return the generated timetable
        return jsonify({"timetable": timetable})

    except Exception as e:
        # Debugging: Print the full exception traceback
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500
    
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

    # Load PDF and extract text
    try:
        # Extract text from the PDF
        text = extract_text_from_pdf(pdf_path)
        if not text:
            return jsonify({"error": "Failed to extract text from PDF"}), 500

        # Create or update ChromaDB with the extracted text
        create_chroma_db(text)

        return jsonify({"message": "PDF uploaded and stored in ChromaDB"}), 200
    except Exception as e:
        print(f"Error processing PDF: {e}")  # Debugging log
        return jsonify({"error": str(e)}), 500



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


import re
import json
import google.generativeai as genai

import time

def ask_gemini_internal(prompt, api_key):
    """
    Calls Gemini API and returns a structured JSON response.

    Parameters:
    - prompt: The formatted prompt.
    - api_key: The API key for authentication.

    Returns:
    - JSON response in the required structure.
    """
    try:
        # Configure API
        genai.configure(api_key=api_key)

        # Initialize the model
        model = genai.GenerativeModel("gemini-1.5-pro")

        # Get response
        response = model.generate_content(prompt)

        # Process the AI response to ensure valid JSON
        structured_response = clean_ai_response(response.text)

        return structured_response
    except Exception as e:
        print("Error in ask_gemini_internal:", str(e))  # Debugging log
        time.sleep(10)  # Add a delay of 10 seconds before retrying
        return {"error": str(e)}

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

        # Extract JSON from the response (handle cases where JSON is embedded in text)
        json_match = re.search(r"\{.*\}", cleaned_text, re.DOTALL)
        if not json_match:
            return {"error": "No JSON found in AI response"}

        json_str = json_match.group(0)

        # Parse JSON response
        quiz_data = json.loads(json_str)

        # Validate structure
        required_keys = {"question", "context", "answer", "evaluation", "feedback"}
        if not required_keys.issubset(quiz_data.keys()):
            return {"error": "Invalid JSON structure received from AI"}

        return quiz_data
    except json.JSONDecodeError:
        return {"error": "Invalid JSON format received from AI"}
    except Exception as e:
        print("Error in clean_ai_response:", str(e))  # Debugging log
        return {"error": str(e)}


@app.route('/parsejson', methods=['POST'])
def parse_json():
    try:
        print("Received request to /parsejson")
        # Get the input string from the form data
        input_string = request.form.get('input_string')

        if not input_string:
            return jsonify({"error": "No input_string provided in form data"}), 400

        # Parse the input string into a JSON object
        parsed_json = json.loads(input_string)
        print(parsed_json)
        # Return the parsed JSON as a response
        return jsonify(parsed_json),200
    except Exception as e:
        # Handle errors gracefully
        return jsonify({"error": str(e)}), 400



@app.route('/generate-feedback', methods=['POST'])
def generate_feedback():
    """
    API endpoint to generate personalized feedback based on student responses.
    """
    try:
        data = request.json
        print("Incoming data:", data)  # Debugging log

        results = data.get("results")

        if not results:
            return jsonify({"error": "Missing required fields"}), 400

        if not isinstance(results, list):
            return jsonify({"error": "Results must be an array"}), 400

        feedback_responses = []

        for result in results:
            if not isinstance(result, dict):
                continue

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
            print("Raw AI response:", feedback)  # Debugging log
            time.sleep(8)
            # Check for errors in the AI response
            if "error" in feedback:
                feedback_responses.append(feedback)
            else:
                feedback_responses.append(feedback)

            # Add a delay between API calls (e.g., 5 seconds)

            time.sleep(10)
        return jsonify(feedback_responses)
    except Exception as e:
        print("Error in generate_feedback:", str(e))  # Debugging log
        return jsonify({"error": str(e)}), 500
    
def postprocess_mipmap_response(response_text):
    """
    Postprocesses the response from Gemini API to ensure it adheres to the Mipmap format.
    """
    # Remove any unwanted characters or extra spaces
    cleaned_text = response_text.strip()

    # Ensure the response starts with "Mipmap" and has the correct hierarchical structure
    if not cleaned_text.startswith("Mipmap"):
        cleaned_text = "Mipmap\n\n" + cleaned_text

    # Use regex to ensure proper formatting of levels and key points
    cleaned_text = re.sub(r'\\*Level (\d+):\\', r'\nLevel \1:*', cleaned_text)
    cleaned_text = re.sub(r'Key Points:\s*-', 'Key Points:\n-', cleaned_text)

    # Remove any extra newlines or spaces
    cleaned_text = re.sub(r'\n+', '\n', cleaned_text).strip()

    return cleaned_text

def ask_gemini_mipmap(prompt, api_key):
    """
    Calls Gemini API and returns a properly structured Mipmap response.
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-pro")

    mipmap_prompt = f"""
    Extract key points from the following text and structure them in a hierarchical Mipmap format.

    *FORMAT STRICTLY LIKE THIS (NO EXTRA CHARACTERS):*

    # Main Topic
    - Brief introduction to the topic
    
    ## Subtopic 1
    - Overview of the subtopic
      - Key points related to this subtopic
      - Additional details if needed
    
    ### Nested Subtopic (Level 2)
    - Further breakdown of Subtopic 1
      - Important details or facts
      - Supporting arguments or examples
    
    ## Subtopic 2
    - Explanation of another key area
      - Step-by-step breakdown (if process-based)
      - Important aspects to consider

   

    *DO NOT ADD EXTRA TEXT OR SYMBOLS. ONLY RETURN FORMATTED MIPMAP STRUCTURE.*
    but omit the keywords like topic ,subtopic , main topic
    Text:
    {prompt}
    """

    response = model.generate_content(mipmap_prompt)

    if response and response.text:
        # Postprocess the response to ensure proper formatting
        formatted_text = postprocess_mipmap_response(response.text)
        return formatted_text
    else:
        return "Error: No response received from Gemini API."

@app.route("/mipmap", methods=["POST"])
def mipmap_endpoint():
    """
    Flask API endpoint to process text from form-data and return a structured Mipmap response.
    """
    try:
        # Check if a file is uploaded
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']


        # Extract text from the PDF
        text = extract_text_from_pdf12(file)


            # Process the extracted text
        response = ask_gemini_mipmap(text, API_KEY)

        return response

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
#######
# for text too  speech
# Function to generate speech from text
def generate_speech(text, voice_id="d2b864ea-e642-4196-9b24-d8a928523a2b", model="blizzard", language="en",
                    format="mp3", sample_rate="16000", speed="1.0"):
    url = "https://api.lmnt.com/v1/ai/speech/bytes"

    payload = {
        "voice": voice_id,
        "text": text,
        "model": model,
        "language": language,
        "format": format,
        "sample_rate": sample_rate,
    }

    headers = {
        "X-API-Key": LMNT_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
    }

    response = requests.post(url, data=payload, headers=headers)

    if response.status_code == 200:
        # Convert raw audio bytes to Base64
        audio_base64 = base64.b64encode(response.content).decode("utf-8")
        return audio_base64
    else:
        return None


@app.route("/generate_speech", methods=["POST"])
def generate_speech_api():
    data = request.json
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "Text parameter is required"}), 400

    result = generate_speech(text)
    if result:
        print(result)
        return jsonify({"speech": result})
    else:
        return jsonify({"error": "Failed to generate speech"}), 500
#######

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)