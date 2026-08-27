import streamlit as st
import pandas as pd

st.set_page_config(page_title="MPLADS AI Risk Detection", layout="wide")

df = pd.read_csv(
    "data/processed/MPLADS_FINAL_RISK_EXPLAINABLE.csv"
)

st.title("MPLADS AI Risk Detection")
st.caption("AI-assisted anomaly and risk detection")

# Metrics
total = len(df)
critical = (df["final_risk_level"] == "CRITICAL").sum()
high = (df["final_risk_level"] == "HIGH").sum()
medium = (df["final_risk_level"] == "MEDIUM").sum()

c1, c2, c3, c4 = st.columns(4)

c1.metric("Total Projects", f"{total:,}")
c2.metric("Critical", critical)
c3.metric("High", high)
c4.metric("Medium", medium)

st.divider()

st.subheader("Risk Distribution")
st.bar_chart(df["final_risk_level"].value_counts())

st.subheader("Top High-Risk Projects")

top = df.sort_values(
    "final_risk_score",
    ascending=False
)[[
    "work_id",
    "state",
    "mp_name",
    "final_risk_score",
    "final_risk_level",
    "primary_evidence",
    "evidence_confidence"
]].head(20)

st.dataframe(top, use_container_width=True)

st.subheader("Project Investigation")

work_id = st.selectbox(
    "Select a project",
    top["work_id"].tolist()
)

project = df[df["work_id"] == work_id].iloc[0]

st.metric("Risk Score", project["final_risk_score"])

st.write("**MP Name:**", project["mp_name"])
st.write("**State:**", project["state"])
st.write("**Risk Level:**", project["final_risk_level"])
st.write("**Primary Evidence:**", project["primary_evidence"])
st.write("**Supporting Evidence:**", project["supporting_evidence"])
st.write("**Confidence:**", project["evidence_confidence"])
st.write("**Recommended Action:**", project["final_recommended_action"])