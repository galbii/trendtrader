
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StockChartViewer from "./StockChartViewer";  // Import your component
import axios from "axios";
import { act } from "react-dom/test-utils";

// Mock Axios request
jest.mock("axios");

describe("StockChartViewer Component", () => {

  test("renders ticker input and fetches stock data", async () => {
    const mockData = {
      timestamps: [1609459200, 1609459260],
      prices: [150, 152],
      regression_data: [],
    };

    axios.get.mockResolvedValueOnce({ data: mockData });

    render(<StockChartViewer />);

    // Check if the ticker input is rendered
    const tickerInput = screen.getByLabelText(/Ticker Symbol:/);
    expect(tickerInput).toBeInTheDocument();

    // Simulate user typing into the ticker input
    fireEvent.change(tickerInput, { target: { value: "AAPL" } });

    // Trigger data fetching by clicking the fetch button (if you have a button)
    fireEvent.click(screen.getByText("Fetch Data"));

    // Wait for the data to be fetched and displayed
    await waitFor(() => screen.getByText("AAPL Price"));

    // Check if the price data is rendered
    expect(screen.getByText("AAPL Price")).toBeInTheDocument();
  });

  test("handles the error when stock data is not found", async () => {
    axios.get.mockRejectedValueOnce(new Error("Stock data not found"));

    render(<StockChartViewer />);

    // Simulate clicking the fetch button
    fireEvent.click(screen.getByText("Fetch Data"));

    // Wait for the error message
    await waitFor(() => screen.getByText("Error fetching stock data"));

    expect(screen.getByText("Error fetching stock data")).toBeInTheDocument();
  });

  test("logs a new trade", async () => {
    const newTradeData = {
      ticker: "AAPL",
      price: "150.00",
      time: "2024-12-10T14:45",
      status: "open",
    };

    render(<StockChartViewer />);

    // Simulate entering trade details
    fireEvent.change(screen.getByLabelText(/Price:/), { target: { value: "150.00" } });
    fireEvent.change(screen.getByLabelText(/Time:/), { target: { value: "2024-12-10T14:45" } });

    // Simulate clicking the log trade button
    fireEvent.click(screen.getByText(/Log Trade/));

    // Check if the trade is added to the trade log
    await waitFor(() => screen.getByText("Trade logged successfully"));
    expect(screen.getByText("Trade logged successfully")).toBeInTheDocument();
  });

  test("show regression line on chart", async () => {
    const mockData = {
      timestamps: [1609459200, 1609459260],
      prices: [150, 152],
      regression_data: [151, 153],
    };

    axios.get.mockResolvedValueOnce({ data: mockData });

    render(<StockChartViewer />);

    // Simulate showing regression curve
    fireEvent.click(screen.getByLabelText(/Show Regression Curve/));

    // Wait for the chart to update and check for regression data
    await waitFor(() => screen.getByText(/Regression Line/));
    expect(screen.getByText("Regression Line")).toBeInTheDocument();
  });

});
