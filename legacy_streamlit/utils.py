# utils.py
import pandas as pd
import streamlit as st
import warnings

# Suppress OLE2/sector size warnings
warnings.filterwarnings("ignore", category=UserWarning, module='xlrd')

def load_file(file):
    """
    Loads data from an uploaded CSV, XLSX, or XLS file into a pandas DataFrame.
    """
    try:
        if file.name.endswith(".csv"):
            return pd.read_csv(file)
        elif file.name.endswith(".xlsx"):
            return pd.read_excel(file, engine='openpyxl')
        elif file.name.endswith(".xls"):
            return pd.read_excel(file, engine='xlrd')
        else:
            st.error("지원되지 않는 파일 형식입니다.")
            return None
    except Exception as e:
        st.error(f"파일을 읽는 중 오류가 발생했습니다: {e}")
        return None
