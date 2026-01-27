# COZA Global Facial Attendance System

## Overview
This system provides:

- Facial registration
- Instant face recognition
- Visitor detection
- Cross-branch intelligence
- Local AI processing
- Cloud backup recovery

## Architecture

Local Laptop:
- Face detection
- Face embedding
- FAISS matching
- Attendance logging

Cloud (Supabase):
- Member backup
- Embedding backup
- Reports & analytics
- Disaster recovery

## Startup

```bash
pip install -r requirements.txt
python portal/app.py
