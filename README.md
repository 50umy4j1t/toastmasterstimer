# Toastmasters Timer

A simple Streamlit-based timer app for Toastmasters meetings. Track speech times with green/yellow/red indicators and save results by category.

## Features

- **Presets** for common speech types:
  - Table Topics (1-2 min)
  - Evaluation (2-3 min)
  - Speech (5-7 min)
  - Custom (user-defined)
- **Traffic light indicators** (green/yellow/red images)
- **Disqualification tracking** (red + 30 seconds)
- **Save times** by speaker name
- **Results page** with categorized tables and status emojis
- **Customizable time thresholds**

## Installation

1. Make sure you have Python 3.8+ installed

2. Install Streamlit:
   ```bash
   pip install streamlit
   ```

3. Clone or download this repository

## Usage

1. Navigate to the project directory:
   ```bash
   cd toastmasterstimer
   ```

2. Run the app:
   ```bash
   streamlit run app.py
   ```

3. Open your browser to the URL shown (usually http://localhost:8501)

## How to Use

1. Select a **preset** from the sidebar (Table Topics, Evaluation, Speech, or Custom)
2. Adjust time thresholds if needed (Green/Yellow/Red/Disqualify)
3. Enter the **speaker's name**
4. Click **START** to begin timing
5. Click **PAUSE** when the speaker finishes
6. Click **SAVE TIME** to record the result
7. View all saved times on the **Results** page

## Files

- `app.py` - Main application
- `green.jpg` - Green light image
- `yellow.jpg` - Yellow light image
- `red.jpg` - Red light image

## Author

**Soumyajit Ray**

- GitHub: https://github.com/50umy4j1t
- LinkedIn: https://www.linkedin.com/in/soumya532/

UEM Kolkata Toastmasters Club
