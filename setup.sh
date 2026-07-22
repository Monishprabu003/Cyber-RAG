#!/bin/bash

# Cyber RAG Setup and Verification Script

echo "🛡️  Cyber Security RAG - Setup & Verification"
echo "=============================================="
echo ""

# Check Python version
echo "1️⃣  Checking Python version..."
python_version=$(python3 --version 2>&1)
echo "   $python_version"
echo ""

# Create virtual environment
echo "2️⃣  Creating virtual environment..."
if [ -d "venv" ]; then
    echo "   ✅ Virtual environment already exists"
else
    python3 -m venv venv
    echo "   ✅ Virtual environment created"
fi
echo ""

# Activate virtual environment
echo "3️⃣  Activating virtual environment..."
source venv/bin/activate
echo "   ✅ Virtual environment activated"
echo ""

# Upgrade pip
echo "4️⃣  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
echo "   ✅ pip upgraded"
echo ""

# Install requirements
echo "5️⃣  Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Dependencies installed successfully"
else
    echo "   ❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Verify imports
echo "6️⃣  Verifying imports..."
python3 << 'VERIFY'
import sys
try:
    import streamlit
    print("   ✅ streamlit")
except: print("   ❌ streamlit")

try:
    import langchain
    print("   ✅ langchain")
except: print("   ❌ langchain")

try:
    import chromadb
    print("   ✅ chromadb")
except: print("   ❌ chromadb")

try:
    import sentence_transformers
    print("   ✅ sentence_transformers")
except: print("   ❌ sentence_transformers")

try:
    import pypdf
    print("   ✅ pypdf")
except: print("   ❌ pypdf")

try:
    import google.generativeai
    print("   ✅ google-generativeai")
except: print("   ❌ google-generativeai")

try:
    import langchain_google_genai
    print("   ✅ langchain-google-genai")
except: print("   ❌ langchain-google-genai")
VERIFY
echo ""

# Check Gemini API Key
echo "7️⃣  Checking Gemini API Key status..."
gemini_status="missing"
if [ -f ".env" ] && grep -q "GEMINI_API_KEY=" .env && ! grep -q "GEMINI_API_KEY=your_key_here" .env; then
    echo "   ✅ GEMINI_API_KEY found in .env"
    gemini_status="configured"
elif [ ! -z "$GEMINI_API_KEY" ]; then
    echo "   ✅ GEMINI_API_KEY found in system environment"
    gemini_status="configured"
else
    echo "   ⚠️  GEMINI_API_KEY is not configured yet"
    gemini_status="missing"
fi
echo ""

# Verify project structure
echo "8️⃣  Verifying project structure..."
files=(
    "app.py"
    "requirements.txt"
    "README.md"
    ".gitignore"
    "src/__init__.py"
    "src/utils.py"
    "src/ingest.py"
    "src/retriever.py"
    "src/rag_chain.py"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (MISSING)"
    fi
done
echo ""

# Summary
echo "=============================================="
echo "✅ Setup Complete!"
echo "=============================================="
echo ""
echo "🚀 Next steps:"
echo ""
echo "1. Configure your Gemini API Key in the .env file:"
echo "   cp .env.example .env"
echo "   (Open .env and replace 'your_key_here' with your Google Gemini API Key)"
echo ""
echo "2. Start the Streamlit app:"
echo "   streamlit run app.py"
echo ""
echo "3. Open http://localhost:8501 in your browser"
echo ""

if [ "$gemini_status" = "missing" ]; then
    echo "⚠️  IMPORTANT: You must set GEMINI_API_KEY in .env before using the app!"
fi

