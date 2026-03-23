# Artist-Toolbox: Project Development Brief

I want to build a professional-grade React application for painters called **Artist-Toolbox** using **Mantine UI**, **HTML5 Canvas**, and **jspdf**.

### 1. Project Philosophy & Dependencies
* **Don't Reinvent the Wheel:** Use established libraries for complex logic (K-Means, Color Math, PDF generation) unless there is a significant performance or bundle-size reason to write it from scratch.
* **Suggested Dependencies:** * `@mantine/core`, `@mantine/hooks`, `@mantine/notifications` (UI)
    * `ml-kmeans` or `skmeans` (For color quantization)
    * `chroma-js` or `color-diff` (For advanced color space conversions and Delta-E matching)
    * `jspdf` (For report generation)
    * `lucide-react` (For iconography)
* **Flexibility:** You are free to swap these for better-suited libraries or omit them if a native Web API (like the Canvas API) is more efficient for the task.

### 2. The Flexible Data & Storage Layer
* **State Structure:** The app must manage a `ProjectState` object.
* **Storage Wrapper:** Create a `StorageService` interface. Implement a `JSONLocalStorage` provider for now, structured so it can be swapped for **Firebase** or a **NoSQL/SQLite** backend later.
* **Palette Schema:** The `palette` must be an array of `Color` objects:
    ```typescript
    type Color = {
      id: string;
      hex: string;
      locked: boolean; // If true, K-Means should not overwrite this color during recalculation
      ratio: number;   // Percentage of image coverage
      mixRecipe: string; 
    };
    ```

### 3. The Pixel-Perfect Processing Pipeline
The image must flow through these stages. **Crucially, all filters and adjustments must be performed directly on the Canvas ImageData (pixel manipulation)** so the indexer analyzes the *modified* pixels:
1.  **Source:** Original uploaded file.
2.  **Filter Stage:** Sliders for **Brightness, Contrast, Saturation, Temperature (Warm/Cool), and Tint (Green/Magenta)**.
3.  **Detail Simplification:** A **Gaussian Blur** slider (0-50px).
4.  **Quantization:** A clustering algorithm (e.g., K-Means) to generate the `palette`. It must respect any `locked` colors already in the state.
5.  **Viewports:** A Three-pane layout: **Filtered Original**, **Indexed Result**, and the **Palette Sidebar**.

### 4. Feature: The 'Painter's Sampler'
* **Area Sampling:** Clicking a palette swatch enters 'Sample Mode'.
* **Circular UI:** On the 'Filtered Original' canvas, show a circular cursor (radius 1-100px).
* **Math:** Calculate the **average RGBA** of all pixels within that circle on the filtered canvas.
* **Update:** Update the selected `Color` object. This must immediately trigger a re-mapping of the 'Indexed Result' using the new color.
* **UX:** Use `Esc` or a 'Cancel' button to exit.

### 5. Feature: Subtractive Mixing & Pigment Database
The app should use the following **Reference Pigment List** to calculate the `mixRecipe` (finding the closest mathematical combination of these colors to reach the target hex):

| Pigment Name | Hex Code |
| :--- | :--- |
| Titanium White | #FFFFFF |
| Ivory Black | #231F20 |
| Cadmium Yellow | #FFF600 |
| Yellow Ochre | #CB9D06 |
| Cadmium Red | #E30022 |
| Alizarin Crimson | #841B2D |
| Ultramarine Blue | #4169E1 |
| Phthalo Blue | #000F89 |
| Viridian Green | #007F5C |
| Raw Umber | #826644 |
| Burnt Sienna | #8A3324 |

* **Mix Logic:** Implement an algorithm (likely using CMYK or LAB space) that approximates how these pigments blend subtractively to reach the target palette color.
* **PDF Export:** Generate a multi-page report showing the side-by-side images and a breakdown of pigment "parts" for each palette swatch.

### 6. Technical Execution
* **Performance:** Use `useMemo` for heavy calculations and a 300ms debounce for sliders.
* **Structure:** Provide a clean, modular file structure, separating the Canvas logic, clustering utilities, and color mixing logic.