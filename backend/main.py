"""
MeetingMind Backend
Entry point — run with: uvicorn main:app --reload
"""
import sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))


from app import create_app

app = create_app()
