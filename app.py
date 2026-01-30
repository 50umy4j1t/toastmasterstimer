import streamlit as st
import time

st.set_page_config(page_title="Toastmasters Timer", layout="centered")

# Presets: (green, yellow, red, disqualify) in seconds
PRESETS = {
    "Table Topics (1-2 min)": (60, 90, 120, 150),
    "Evaluation (2-3 min)": (120, 150, 180, 210),
    "Speech (5-7 min)": (300, 360, 420, 450),
    "Custom": (2, 4, 6, 7),
}

# Categories for saving
CATEGORIES = ["Table Topics", "Evaluation", "Speech"]

# Default thresholds per category (green, yellow, red, dq)
CATEGORY_THRESHOLDS = {
    "Table Topics": (60, 90, 120, 150),
    "Evaluation": (120, 150, 180, 210),
    "Speech": (300, 360, 420, 450),
}

# Map presets to categories
PRESET_TO_CATEGORY = {
    "Table Topics (1-2 min)": "Table Topics",
    "Evaluation (2-3 min)": "Evaluation",
    "Speech (5-7 min)": "Speech",
}

# Initialize session state
if "running" not in st.session_state:
    st.session_state.running = False
    st.session_state.elapsed = 0
if "saved_times" not in st.session_state:
    # Store as {category: {name: seconds}}
    st.session_state.saved_times = {
        "Table Topics": {},
        "Evaluation": {},
        "Speech": {},
    }

# Sidebar
with st.sidebar:
    st.header("Navigation")
    page = st.selectbox("Page", ["Timer", "Results", "About"])
    st.divider()
    st.header("Presets")
    preset = st.radio("Choose a speech type:", list(PRESETS.keys()))


def get_status_emoji(seconds, green, yellow, red, dq):
    """Return emoji based on time thresholds."""
    if seconds >= dq:
        return "❌"
    elif seconds >= red:
        return "🔴"
    elif seconds >= yellow:
        return "🟡"
    elif seconds >= green:
        return "🟢"
    else:
        return "⚪"


def format_time(seconds):
    """Format seconds as mm:ss."""
    mm, ss = seconds // 60, seconds % 60
    return f"{mm:02d}:{ss:02d}"


def timer_page():
    st.title("Toastmasters Timer")

    # Get default values from preset
    default_green, default_yellow, default_red, default_dq = PRESETS[preset]

    # Time settings with minutes and seconds (always visible)
    st.subheader("Time Settings")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.write("Green")
        g_min = st.number_input("min", min_value=0, value=default_green // 60, key="g_min")
        g_sec = st.number_input("sec", min_value=0, max_value=59, value=default_green % 60, key="g_sec")
        green_time = g_min * 60 + g_sec
    with col2:
        st.write("Yellow")
        y_min = st.number_input("min", min_value=0, value=default_yellow // 60, key="y_min")
        y_sec = st.number_input("sec", min_value=0, max_value=59, value=default_yellow % 60, key="y_sec")
        yellow_time = y_min * 60 + y_sec
    with col3:
        st.write("Red")
        r_min = st.number_input("min", min_value=0, value=default_red // 60, key="r_min")
        r_sec = st.number_input("sec", min_value=0, max_value=59, value=default_red % 60, key="r_sec")
        red_time = r_min * 60 + r_sec
    with col4:
        st.write("Disqualify")
        dq_min = st.number_input("min", min_value=0, value=default_dq // 60, key="dq_min")
        dq_sec = st.number_input("sec", min_value=0, max_value=59, value=default_dq % 60, key="dq_sec")
        dq_time = dq_min * 60 + dq_sec

    # Speaker name input
    speaker_name = st.text_input("Speaker Name", placeholder="Enter speaker name...")

    # Category selector for Custom preset
    if preset == "Custom":
        save_category = st.selectbox("Save to category:", CATEGORIES)
    else:
        save_category = PRESET_TO_CATEGORY[preset]

    # Control buttons
    btn1, btn2, btn3 = st.columns(3)
    with btn1:
        if st.button("START", use_container_width=True):
            st.session_state.running = True
    with btn2:
        if st.button("PAUSE", use_container_width=True):
            st.session_state.running = False
    with btn3:
        if st.button("RESET", use_container_width=True):
            st.session_state.running = False
            st.session_state.elapsed = 0
            st.rerun()

    # Display timer
    elapsed = st.session_state.elapsed
    mm, ss = elapsed // 60, elapsed % 60
    st.markdown(f"<h1 style='text-align:center; font-size:5rem;'>{mm:02d}:{ss:02d}</h1>", unsafe_allow_html=True)

    # Save button (only when paused and has time)
    if not st.session_state.running and st.session_state.elapsed > 0:
        if st.button("SAVE TIME", use_container_width=True, type="primary"):
            category_times = st.session_state.saved_times[save_category]
            name = speaker_name.strip() if speaker_name else f"Speaker {len(category_times) + 1}"
            # Save elapsed seconds (not formatted string)
            st.session_state.saved_times[save_category][name] = elapsed
            st.session_state.elapsed = 0
            st.success(f"Saved {name}: {mm:02d}:{ss:02d} to {save_category}")
            st.rerun()

    # Traffic light indicator
    if elapsed >= dq_time:
        st.image("red.jpg")
    elif elapsed >= red_time:
        st.image("red.jpg")
    elif elapsed >= yellow_time:
        st.image("yellow.jpg")
    elif elapsed >= green_time:
        st.image("green.jpg")
    else:
        st.info(" \n \n \n \n ")

    # Bottom control buttons
    btn4, btn5, btn6 = st.columns(3)
    with btn4:
        if st.button("START", use_container_width=True, key="start2"):
            st.session_state.running = True
    with btn5:
        if st.button("PAUSE", use_container_width=True, key="pause2"):
            st.session_state.running = False
    with btn6:
        if st.button("RESET", use_container_width=True, key="reset2"):
            st.session_state.running = False
            st.session_state.elapsed = 0
            st.rerun()

    # Bottom save button (only when paused and has time)
    if not st.session_state.running and st.session_state.elapsed > 0:
        if st.button("SAVE TIME", use_container_width=True, type="primary", key="save2"):
            category_times = st.session_state.saved_times[save_category]
            name = speaker_name.strip() if speaker_name else f"Speaker {len(category_times) + 1}"
            st.session_state.saved_times[save_category][name] = elapsed
            st.session_state.elapsed = 0
            st.success(f"Saved {name}: {mm:02d}:{ss:02d} to {save_category}")
            st.rerun()

    # Timer logic
    if st.session_state.running:
        time.sleep(1)
        st.session_state.elapsed += 1
        st.rerun()


def results_page():
    st.title("Results")

    has_any = any(st.session_state.saved_times[cat] for cat in CATEGORIES)
    if not has_any:
        st.info("No saved times yet. Go to Timer page and save some times!")
        return

    # Show each category as a separate table
    for category in CATEGORIES:
        times = st.session_state.saved_times[category]
        if times:
            st.subheader(category)
            green, yellow, red, dq = CATEGORY_THRESHOLDS[category]
            data = []
            for name, seconds in times.items():
                emoji = get_status_emoji(seconds, green, yellow, red, dq)
                data.append({
                    "Status": emoji,
                    "Name": name,
                    "Time": format_time(seconds),
                })
            st.table(data)

    st.divider()

    # Clear buttons
    col1, col2 = st.columns(2)
    with col1:
        clear_cat = st.selectbox("Clear category:", CATEGORIES)
    with col2:
        st.write("")  # spacer
        st.write("")  # spacer
        if st.button("Clear Category"):
            st.session_state.saved_times[clear_cat] = {}
            st.rerun()

    if st.button("Clear All Results", type="secondary"):
        st.session_state.saved_times = {cat: {} for cat in CATEGORIES}

        st.rerun()


def about_page():
    st.title("About")

    st.markdown("""
    ### Toastmasters Timer

    A simple timer app for Toastmasters meetings to track speech times with
    green/yellow/red indicators.

    ---

    ### Made by

    **Soumyajit Ray**

    Punk rocker who spends most of his time in the virtual worlds of video games
    and sci-fi novels. Passionate techie.

    Student at **University of Engineering and Management, Kolkata (Newtown)**

    Member of **UEM Kolkata Toastmasters Club**

    ---

    ### Connect with me
    """)

    col1, col2 = st.columns(2)
    with col1:
        st.link_button("GitHub", "https://github.com/50umy4j1t", use_container_width=True)
    with col2:
        st.link_button("LinkedIn", "https://www.linkedin.com/in/soumya532/", use_container_width=True)


# Page routing
if page == "Timer":
    timer_page()
elif page == "Results":
    results_page()
else:
    about_page()
