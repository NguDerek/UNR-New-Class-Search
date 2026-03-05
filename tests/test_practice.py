import pandas as pd
from flask_backend.ETL import etl_pipeline

# monkeypatch temporarily replaces pandas.read_excel during the test
def test_extract_excel_adds_year_column(monkeypatch):
    mock_excel_df = pd.DataFrame({
        "College": ["SCI"],
        "Acad Org": ["CS"]
    })

    # args = filename, kwargs = {header=1, index_col=None}
    def mock_read_excel(*args, **kwargs):
        return mock_excel_df.copy()

    monkeypatch.setattr(pd, "read_excel", mock_read_excel)
    filename = "Fall 2025 Master Schedule - Copy.xlsx"
    result_df = etl_pipeline.extract_excel(filename)

    assert "year" in result_df.columns
    assert result_df["year"].iloc[0] == 2025