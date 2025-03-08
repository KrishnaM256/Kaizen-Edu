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

app = Flask(__name__)
CORS(app)


DB_PATH = "flask\chroma_db9"
os.makedirs(DB_PATH, exist_ok=True)
SCORING_MODEL = genai.GenerativeModel('gemini-1.5-pro')
API_KEY = "AIzaSyCRPHBaZTUVv7EsYkBTDZnbOFCsrdmx7zE"


def extract_text_from_pdf(pdf_path):
    """Extracts text from a PDF file."""
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text("text") + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return None
    return text.strip()


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
    print(vector_index)
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
    result = db.similarity_search(query, k=k)  # Store result in a variable
    print(result)
    return result  # Return the result properly


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



@app.route("/query", methods=["POST"])
def get_query():
    data = request.json
    query = data.get("query")

    if not query:
        return jsonify({"error": "Query not provided"}), 400
    
    ans = get_chroma_context(query, k=3)

    # Formatting the response
    result = [doc.page_content for doc in ans]
    
    return jsonify({"result": result}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)