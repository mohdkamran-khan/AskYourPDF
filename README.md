# 📄 AskYourPDF — AI Document Question-Answering (Capstone Project)

<p align="center"> <img src="https://img.shields.io/badge/AI%20Agents%20Intensive-Google%20%7C%20Kaggle-blue?style=for-the-badge" /> <img src="https://img.shields.io/badge/Category-Concierge%20Agent-success?style=for-the-badge" /> <img src="https://img.shields.io/badge/Status-Completed-brightgreen?style=for-the-badge" /> </p>

A simple and clean AI-powered PDF Question Answering Agent built as part of the 5-Day AI Agents Intensive Course with Google & Kaggle (2025) where users upload a PDF and ask questions. This repository is a minimal, demonstrable project that satisfies the Kaggle/Google Capstone submission requirements.

## 📸Screenshots

1. Home Page:
 
<img width="2880" height="1608" alt="askpdfhome" src="https://github.com/user-attachments/assets/2cf46b04-86ff-447d-8c34-53b41e0771e5" />

---

2. Results Page:

<img width="2880" height="1576" alt="askpdfdemo" src="https://github.com/user-attachments/assets/ad0363e2-b9f9-4bc9-a71e-7de59244762b" />

---

3. Architecture:

<img width="1536" height="1024" alt="askyourpdfarchitecture" src="https://github.com/user-attachments/assets/f749304e-1301-48a8-ab64-16f5319b916c" />

---

## Users can:

- Upload a PDF

- Ask questions about its contents

- Receive contextual answers with source references

- (Optional) Run in mock embedding mode to avoid API costs / quota usage

 ---

## This project is intentionally minimal, easy to run, and perfect for a capstone submission.

---

## ✨ Features

🔹Upload any PDF (up to ~10MB)

🔹Background processing of chunks

🔹Mock Embeddings Mode → works even without OpenAI API key

🔹Ask natural language questions about the document

🔹Source pages + similarity scores

🔹Beautiful and responsive React UI

🔹Node.js backend with in-memory vector search

---

## 🖥️ Tech Stack
## Frontend

- React (Vite)

- Custom UI (no CSS frameworks needed)

- Fetch API for server communication

## Backend

- Node.js + Express

- PDF parsing (pdf-parse)

- In-memory vector store

- OpenAI-compatible structure (mock or real)

- Multer for file upload

---

## 📂 Folder Structure

 ```bash
ask-your-pdf
├── client/         # React frontend
├── server/         # Node.js backend
│   ├── embeddings.js
│   ├── index.js
│   └── uploads/
├── README.md       # This file
└── ...
```
---

## 🔧 Installation & Setup

Clone the repository:

```bash
git clone https://github.com/yourusername/ask-your-pdf.git
cd ask-your-pdf
```

---

## 🛠️ Backend Setup (Server)

 ```bash
cd server
npm install
```
---

## Environment variables

Create a .env file:

```bash
OPENAI_API_KEY=
```

## Start the backend:

```bash
npm run dev
```
---

## 🎨 Frontend Setup (Client)

```bash
cd ../client
npm install
npm run dev
```
---

## 📚 How It Works

1. Upload PDF

   The server extracts text, splits it into chunks, and (in real mode) generates embeddings.

2. Ask a Question

   The question is embedded and compared with stored chunk vectors.

3. Relevant chunks are fed into the model

   In mock mode → uses local pseudo-embeddings

   In real mode → uses OpenAI embeddings + Chat Completions

4. Final answer is displayed with source references.

---

## 🧪 Mock Embeddings Explained

This project supports a full offline mode where:

- No API calls are made

- No cost is incurred

- Embeddings are simulated using deterministic vectors

---

## 🌟 Credits

Built by Kamran (mohdkamrankhan)
Capstone for Google x Kaggle — 5-Day AI Agents Intensive (2025)

---

## 📄 License

This project is open-source and available under the [MIT License]

---

📧 Contact / Feedback

If you find any bugs or want to suggest improvements, feel free to open an issue or create a pull request. You can reach me at: [mohdkamrankhan.dev@gmail.com]

---

💡 If you like my work, please ⭐ my repos. Your support inspires me to build more projects! 🚀

---

👨🏻‍💻 From [mohdkamran-khan](https://github.com/mohdkamran-khan)
