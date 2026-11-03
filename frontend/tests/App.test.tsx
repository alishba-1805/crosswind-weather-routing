import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect, afterEach } from "vitest";
import App from "../src/App";
import { fixture } from "./fixture";
vi.mock("../src/RouteMap", () => ({
  RouteMap: ({
    offset,
    onSelect,
  }: {
    offset: number;
    onSelect: (id: string) => void;
  }) => (
    <button onClick={() => onSelect("route-2")}>Map selection {offset}</button>
  ),
}));
afterEach(() => vi.unstubAllGlobals());
test("autocomplete, keyboard selection, submit, route selection and forecast offsets", async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => ({
      ok: true,
      json: async () =>
        path.includes("/places")
          ? { places: [{ label: "Frederick, MD", position: [-77.41, 39.41] }] }
          : fixture(),
    })),
  );
  render(<App />);
  for (const label of ["Origin", "Destination"]) {
    await user.type(screen.getByRole("combobox", { name: label }), "Fred");
    await screen.findByRole("option", { name: "Frederick, MD" });
    await user.keyboard("{ArrowDown}{Enter}");
  }
  await user.click(screen.getByRole("button", { name: /Compare routes/ }));
  await screen.findByRole("region", { name: "Route exposure comparison" });
  await user.click(screen.getByRole("button", { name: "Map selection 0" }));
  expect(screen.getByRole("button", { name: /Route 2/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const slider = screen.getByRole("slider");
  for (const hour of [0, 24, 48]) {
    fireEvent.change(slider, { target: { value: String(hour) } });
    expect(
      screen.getByRole("button", { name: "Map selection " + hour }),
    ).toBeInTheDocument();
  }
  await user.click(screen.getByRole("button", { name: /Origin/ }));
  expect(
    screen.getByRole("region", { name: "Checkpoint weather" }),
  ).toBeInTheDocument();
});
test("empty state and invalid selection feedback", async () => {
  render(<App />);
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  // Native required validation prevents blank form submission; explicit handler checks selections.
  fireEvent.submit(
    screen.getByRole("button", { name: /Compare routes/ }).closest("form")!,
  );
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Select origin"),
  );
});

test("loading state ends with a structured request error", async () => {
  const user = userEvent.setup();
  let rejectAnalysis: (reason: Error) => void = () => {};
  vi.stubGlobal(
    "fetch",
    vi.fn((path: string) =>
      path.includes("/places")
        ? Promise.resolve({
            ok: true,
            json: async () => ({
              places: [{ label: "Test place", position: [-77, 39] }],
            }),
          })
        : new Promise((_resolve, reject) => {
            rejectAnalysis = reject;
          }),
    ),
  );
  render(<App />);
  for (const label of ["Origin", "Destination"]) {
    await user.type(screen.getByRole("combobox", { name: label }), "Test");
    await user.click(await screen.findByRole("option", { name: "Test place" }));
  }
  await user.click(screen.getByRole("button", { name: /Compare routes/ }));
  expect(screen.getByRole("button", { name: "Analyzing…" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Reading the corridor");
  rejectAnalysis(new Error("Provider quota reached."));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Provider quota reached.",
  );
});

test("missing checkpoint weather remains explicit in the inspector", async () => {
  const user = userEvent.setup();
  const data = fixture();
  data.routes[0].checkpoints[0].risk = "Unknown";
  data.routes[0].checkpoints[0].weather = {
    wind: null,
    rain: null,
    snow: null,
    valid_at: null,
    retrieved_at: null,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => ({
      ok: true,
      json: async () =>
        path.includes("/places")
          ? { places: [{ label: "Test place", position: [-77, 39] }] }
          : data,
    })),
  );
  render(<App />);
  for (const label of ["Origin", "Destination"]) {
    await user.type(screen.getByRole("combobox", { name: label }), "Test");
    await user.click(await screen.findByRole("option", { name: "Test place" }));
  }
  await user.click(screen.getByRole("button", { name: /Compare routes/ }));
  await user.click(await screen.findByRole("button", { name: /Origin/ }));
  expect(
    screen.getByRole("region", { name: "Checkpoint weather" }),
  ).toHaveTextContent("Unknown");
  expect(
    screen.getByRole("region", { name: "Checkpoint weather" }),
  ).toHaveTextContent("Unavailable");
});
