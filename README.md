# Smart Timetable AI Application

## Overview
Smart Timetable is an intelligent, automated scheduling application designed to help users seamlessly integrate tasks with their Google Calendar. By leveraging AI technologies, the application parses tasks, calculates optimal scheduling times, and assists users in managing their schedules through a responsive and modern interface.

## Key Features
* **AI Scheduler:** Automatically schedules tasks by analyzing task priority, duration, and deadlines against available free time in your Google Calendar.
* **Intelligent Dashboard:** A centralized dashboard that tracks your task completion streaks, active time slots, and overdue assignments.
* **Interactive AI Console:** A built-in AI assistant capable of analyzing your schedule, answering queries about upcoming tasks, and interacting using advanced Markdown rendering.
* **Multi-Engine Support:** Choose between local processing (Standard Keyword parsing), predefined cloud models, or bring your own API key for custom processing.
* **Calendar Integration:** Seamless synchronization with Google Calendar for fetching events and inserting new, AI-scheduled slots.

## Technology Stack
* **Frontend:** React, HTML5, CSS3
* **Backend:** Python, Flask
* **Database:** MongoDB
* **APIs:** Google Calendar API, OpenRouter (for AI processing)

## Setup Instructions

### 1. Prerequisites
* Python 3.8+ installed on your system.
* MongoDB installed and running locally, or an accessible MongoDB Atlas URI.
* A Google Cloud Project with the Google Calendar API enabled and an OAuth 2.0 Client ID.

### 2. Configuration
Create the following configuration files in the root directory:

**credentials.json**
Download your OAuth 2.0 Client ID credentials from the Google Cloud Console and save it as `credentials.json`.

**config.json**
Create a `config.json` file with your environment configurations (database URI, API keys). You may use the provided `config.example.json` as a template.

### 3. Installation
Install the required Python dependencies by running:
```bash
pip install -r requirements.txt
```

### 4. Running the Application
Start the backend server using:
```bash
python app.py
```
By default, the server runs on `http://localhost:5000`. Access this URL in your web browser to start using the Smart Timetable.

## Architecture
The application uses a unified console architecture. The frontend uses a component-based React structure encapsulated in `static/app.jsx`, styled extensively via `static/style.css`. The backend in `app.py` handles API routing, Google Calendar authentication, and communication with AI endpoints.
