import "./App.css";
import React, { useState } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import logo from './logo-192.png';

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [isShowButtonActive, setIsShowButtonActive] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [fetchedData, setFetchedData] = useState({
    periods: [],
    financialItems: [],
    sectionTotals: [],
    validationResult: [],
  });

  const handleDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile && selectedFile.type === "application/pdf") {
        setIsButtonActive(true);
        setFile(selectedFile);
        setError("");
      } else {
        alert("Please upload a valid PDF file.");
        setFile(null);
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDropAccepted: handleDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    noClick: true,
  });

  const handleInputChange = (e) => {
    if (e.target.id === "file-input" && e.target.files.length > 0) {
      setIsButtonActive(true);
      setFile(e.target.files[0]);
      setError("");
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (file && !isUploading) {
      const formData = new FormData();
      formData.append("file", file);

      setIsUploading(true);
      setUploadProgress(0);

      try {
        const response = await axios.post(
          "https://financial-pdf-extractor-backend.onrender.com/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            },
          }
        );

        if (response && response.data) {
          setIsShowButtonActive(true);
          setSuccess(response.data.message);
          setExtractedText(response.data.tables);
          setError("");
        } else {
          setError("An error occurred.");
          setSuccess("");
        }
      } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.message);
          setSuccess("");
        } else {
          setError("An error occurred.");
          setSuccess("");
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleReset = () => {
    setFile(null);
    setError("");
    setSuccess("");
    setExtractedText("");
    setFetchedData({
      periods: [],
      financialItems: [],
      sectionTotals: [],
      validationResult: [],
    });
    setIsButtonActive(false);
    setIsShowButtonActive(false);
    document.getElementById("file-input").value = null;
  };

  const handleShowData = async () => {
    if (extractedText) {
      try {
        const response = await fetch("https://financial-pdf-extractor-backend.onrender.com/fetch-data");
        if (!response.ok) {
          throw new Error("Server Down");
        }
        const data = await response.json();
        const structuredData = {
          periods: data.periods,
          financialItems: data.financialItems,
          sectionTotals: data.sectionTotals,
          validationResult: data.validationResults,
        };
        setFetchedData(structuredData);
        setShowPopup(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data from the API.");
      }
    } else {
      alert("No text extracted.");
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleClickOutside = (e) => {
    if (e.target.className === "popup-overlay") {
      setShowPopup(false);
    }
  };

  return (
    <div className="App">
      <header>
      <a href="/">
        <div className="headerContainer">
          <img src={logo} alt="Financial Pdf Extractor" />
          <h1>Financial Pdf Extractor</h1>
        </div>
        </a>
        
      </header>
      <form className="formStyle">
        <h4 className="title">Upload Your PDF</h4>
        <br />
        <div className="file-upload" {...getRootProps()}>
          <input
            id="file-input"
            className="form-control"
            type="file"
            name="file"
            accept="application/pdf"
            onChange={handleInputChange}
            {...getInputProps()}
          />
          <label
            htmlFor="v"
            className="file-label"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("file-input").click();
            }}
          >
            <i className="upload-icon">&#x1f4e4;</i> Drag & Drop your file here
            or click to upload
          </label>
        </div>
        {isUploading && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            >
              {uploadProgress}%
            </div>
          </div>
        )}
        <div>
          {file && <p className="fileNameMain">{file.name}</p>}
          {error && <p className="errorText">{error}</p>}
          {success && <p className="successText">{success}</p>}
        </div>
        <div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isButtonActive}
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isButtonActive}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleShowData}
            disabled={!isShowButtonActive}
          >
            Show Data
          </button>
        </div>
      </form>
      {showPopup && (
        <div
          className={`popup-overlay ${showPopup ? "Active" : ""}`}
          onClick={handleClickOutside}
        >
          <div className={`popup ${showPopup ? "Active" : ""}`}>
            <div className="popup-header">
              <p className="fileName">{file.name}</p>
              <button className="close-button" onClick={handleClosePopup}>
                X
              </button>
            </div>
            <div className="popup-content">
              {fetchedData && (
                <table>
                  <thead>
                    <tr>
                      <th className="titleData">Financial Item</th>
                      {fetchedData.periods[0].map((period, index) => (
                        <th className="titleData" key={index}>
                          {period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fetchedData.financialItems[0].map((item, itemIndex) => (
                      <>
                        {item.data.length > 0 && (
                          <>
                            <tr>
                              <th>{item.section_title}</th>
                              <td colSpan={fetchedData.periods[0].length}></td>
                            </tr>
                            {item.data.map((dataItem, dataIndex) => (
                              <tr key={dataIndex}>
                                <th>
                                  &nbsp;&nbsp;&nbsp;{dataItem.sectionName}
                                </th>
                                {dataItem.values.map((value, valueIndex) => (
                                  <td key={valueIndex}>
                                    {value === 0 ? "-" : value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {fetchedData.sectionTotals[0][itemIndex].total
                              .length > 0 && (
                              <tr>
                                <th className="totalc">
                                  Calculated Total{" "}
                                  {
                                    fetchedData.sectionTotals[0][itemIndex]
                                      .section_title
                                  }
                                </th>
                                {fetchedData.sectionTotals[0][
                                  itemIndex
                                ].total.map((value, valueIndex) => (
                                  <td
                                    className={`totalc ${
                                      fetchedData.validationResult[0][itemIndex]
                                        .isValid[valueIndex]
                                        ? "validData"
                                        : "invalidData"
                                    }`}
                                    key={valueIndex}
                                  >
                                    {value}
                                  </td>
                                ))}
                              </tr>
                            )}
                          </>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
