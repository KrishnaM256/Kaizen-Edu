import os
from flask import Flask, request, jsonify
import cv2
import numpy as np

from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# Load face detection classifier
face_classifier = cv2.CascadeClassifier('flask/haarcascades/haarcascade_frontalface_default.xml')


def load_training_data(student_id):
    data_path = f'images/{student_id}/'
    if not os.path.exists(data_path):
        return None, None

    onlyfiles = [f for f in os.listdir(data_path) if os.path.isfile(os.path.join(data_path, f))]
    Training_data, Labels = [], []

    for i, file in enumerate(onlyfiles):
        image_path = os.path.join(data_path, file)
        images = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        Training_data.append(np.asarray(images, dtype=np.uint8))
        Labels.append(0)  # Label 0 for this student

    if len(Training_data) == 0:
        return None, None

    Labels = np.asarray(Labels, dtype=np.int32)
    model = cv2.face.LBPHFaceRecognizer_create()
    model.train(np.asarray(Training_data), Labels)
    return model, True


def face_detector(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_classifier.detectMultiScale(gray, 1.3, 5)

    detected_faces = []
    for (x, y, w, h) in faces:
        roi = gray[y:y + h, x:x + w]
        roi = cv2.resize(roi, (200, 200))
        detected_faces.append(roi)

    return detected_faces, len(faces)


@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    student_id = request.form.get('student_id')
    file = request.files.get('image')

    if not student_id or not file:
        return jsonify({"error": "Student ID and image file are required"}), 400

    model, trained = load_training_data(student_id)
    if not trained:
        return jsonify({"error": "No training data found for student"}), 400

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    except:
        return jsonify({"error": "Invalid image data"}), 400

    faces, num_faces = face_detector(image)
    if num_faces == 0:
        return jsonify({"recognized": False, "message": "No face detected"})

    recognized = False
    for face in faces:
        label, confidence = model.predict(face)
        if confidence < 50:
            recognized = True
            break

    return jsonify({"recognized": recognized})


@app.route('/detect_multiple_faces', methods=['POST'])
def detect_multiple_faces():
    file = request.files.get('image')
    if not file:
        return jsonify({"error": "No image file provided"}), 400

    try:
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    except:
        return jsonify({"error": "Invalid image data"}), 400

    faces, num_faces = face_detector(image)
    if num_faces > 1:
        return jsonify({"multiple_faces": True, "message": "Multiple faces detected"})
    else:
        return jsonify({"multiple_faces": False, "message": "Single or no face detected"})


if __name__ == '__main__':
    app.run(debug=True)