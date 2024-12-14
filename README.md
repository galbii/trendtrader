# Trend Trader Design Document
by Chance Noonan

## Table of Contents

- [Overview](#overview)
- [Application Architecture](#application-architecture)
  - [High-Level Overview](#high-level-overview)
  - [Deployment Architecture](#deployment-architecture)
- [Setting Up the Backend](#setting-up-the-backend)
- [Setting Up the Frontend](#setting-up-the-frontend)
- [Technical Indicators Calculations](#technical-indicators-calculations)
- [Machine Learning Workflow](#machine-learning-workflow)
- [Troubleshooting](#troubleshooting)
- [Conclusion](#conclusion)
- [Blueprint](#blueprint)

## Overview

Trend Trader is a scalable, modular web service designed to provide machine learning-powered insights for stock trading. The application integrates a variety of frontend and backend technologies, including Python, FastAPI, scikit-learn, and React, to offer an easy-to-use API and frontend interface for stock data analysis.

The application allows users to interact with stock charts, visualize technical indicators (like SMA, EMA, MACD, and RSI), and log trades. The machine learning models integrated into the backend provide predictions and insights to guide trading decisions.

## Application Architecture

### High-Level Overview

- **Frontend**: A React-based Single Page Application (SPA) that communicates with the FastAPI backend to display stock charts, technical indicators, and user interfaces for logging trades.

- **Backend**: The FastAPI server handles HTTP requests, exposes machine learning endpoints for prediction tasks, and interfaces with a database for persistent storage.

- **Machine Learning**: The system leverages scikit-learn models to perform stock price predictions, classification, and other analysis tasks.

- **Database**: A SQL database (e.g., PostgreSQL or MySQL) is used to store user data, model predictions, logs, and other persistent information.

### Deployment Architecture

#### Prerequisites

- Node.js & npm (for frontend setup)
- Python 3.8+ (for backend setup)
- A running PostgreSQL or MySQL database
- All required dependencies installed for both frontend and backend

## Setting Up the Backend

### Clone the Repository

Clone the Trend Trader repository to your local machine:

```bash
git clone https://github.com/galbii/trendtrader.git
```

### Install Backend Dependencies

Navigate to the backend folder and install the required Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

### Start the Backend (FastAPI)

Run the following command to start the FastAPI backend:

```bash
uvicorn app.main:app --reload
```

## Setting Up the Frontend

### Install Frontend Dependencies

In the frontend directory, install the necessary npm dependencies:

```bash
npm install
```

### Start the Frontend Development Server

Start the React development server:

```bash
npm start
```

### Verify the Application

- **Frontend**: Open your browser and visit http://localhost:3000. You should see the React app running and interacting with the FastAPI backend at http://localhost:8000.
- **Backend**: Visit http://localhost:8000/docs to view the FastAPI Swagger UI with all available API endpoints.

### API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Technical Indicators Calculations

### 1. Moving Average (MA)

- **Simple Moving Average (SMA)**: The arithmetic mean of closing prices over a specified number of periods.
- **Exponential Moving Average (EMA)**: Places more weight on recent prices, making it more sensitive to price changes.

### 2. Relative Strength Index (RSI)

**RSI**: Measures the speed and change of price movements. A value above 70 suggests the market may be overbought, while below 30 suggests oversold conditions.

### 3. Moving Average Convergence Divergence (MACD)

**MACD**: Shows the relationship between two moving averages of a security's price, helping identify buying or selling signals.

## Machine Learning Workflow

### 1. Model Training

- **Data Preparation**: Data is preprocessed and cleaned.
- **Model Training**: scikit-learn models (e.g., RandomForest, Logistic Regression) are trained on the data.
- **Model Serialization**: Models are saved using joblib for deployment.

### 2. Model Deployment

Trained models are loaded into the backend when the FastAPI server starts. API endpoints are available for users to submit data and get predictions.

## Troubleshooting

- **Backend not starting**: Ensure all dependencies are installed and database migrations are applied.
- **Frontend not loading**: Check if the React development server is running and environment variables are set correctly.
- **Model prediction issues**: Verify that model files are loaded and input data is correctly formatted.

## Conclusion

This document provides a comprehensive guide to setting up, deploying, and using the Trend Trader application. By leveraging machine learning models and real-time stock data, the application offers a scalable and modular platform for stock trading insights.

## Blueprint

### 1. Overview

The StockChartViewer is a React-based app that integrates with external APIs to fetch and display stock data, including interactive charts, technical indicators, and trade logs. Users can interact with the chart, adjust settings, and view statistical insights like regression lines and trade logs.

### 2. Layout & Structure

- **Header Section**: Displays the app title with a dark gray background.

- **Main Content**: Split into two sections:
  - Left Section: Displays stock charts and technical indicators.
  - Right Section: Sidebar for controls (range, interval, indicator toggles) and trade log.

### 3. Functional Components & Logic

- **State Management**: Manages states for stock data, technical indicators, and trade logs.
- **API Integration**: Fetches stock data and interacts with the backend for stock price and regression analysis.
- **Chart Rendering**: Integrates with react-chartjs-2 for rendering line charts and other visualizations.

### 4. UI/UX Design

- **Responsive Design**: Adjusts layout based on screen size.
- **Interactive Charts**: Displays stock data with overlays and trade logging features.
