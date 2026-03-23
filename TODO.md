# Artist-Toolbox: Project Implementation Checklist

## 🏗️ Phase 1: Project Initialization & Structure
- [x] **Scaffold React Project**
    - Initialize with Vite using the `react-ts` template.
- [x] **Install Core Dependencies**
    - UI: `npm install @mantine/core @mantine/hooks @mantine/notifications @emotion/react @emotion/styled`
    - Icons: `npm install lucide-react`
    - Math & Logic: `npm install chroma-js ml-kmeans jspdf`
- [x] **Define Directory Architecture**
    - `src/components/`: UI elements (Sidebar, Canvas, Sampler).
    - `src/hooks/`: `useCanvasPipeline`, `useProjectState`.
    - `src/services/`: `StorageService.ts`, `ColorMixer.ts`.
    - `src/utils/`: `imageProcessing.ts`, `kMeansWrapper.ts`.
    - `src/types/`: Centralized TypeScript interfaces.
- [x] **Configure Mantine Theme**
    - Set up `MantineProvider` in `App.tsx`.
    - Define a custom theme (e.g., Slate or Graphite) for a "pro-tool" aesthetic.
- [x] **Establish Type Definitions**
    - Define `Color`, `ProjectState`, and `Pigment` types according to the brief.

---

## 🗄️ Phase 2: Data & Storage Layer
- [x] **Implement StorageService Interface**
    - Define methods: `save(state)`, `load()`, `exportJSON()`.
- [x] **Create JSONLocalStorage Provider**
    - Implement the interface using `localStorage`.
    - Add error handling for "Quota Exceeded" (common with large base64 strings).
- [x] **Setup Global State Management**
    - Implement a custom hook or Context to provide the `ProjectState` and dispatchers to the UI.

---

## 🎨 Phase 3: The Pixel-Perfect Processing Pipeline
- [x] **Source Image Loader**
    - Build a file uploader that draws the original image to a "Hidden Source" canvas.
- [x] **Filter Engine (Canvas ImageData)**
    - Implement manual pixel loops for:
        - Brightness ($pixel + value$)
        - Contrast ($factor \times (pixel - 128) + 128$)
        - Temperature (Adjusting Red/Blue channels)
        - Saturation (Interpolating between grayscale and color)
- [x] **Gaussian Blur Utility**
    - Implement a blur pass (Box blur or StackBlur) for "Detail Simplification."
- [x] **K-Means Quantization Service**
    - Integrate `ml-kmeans`.
    - Logic: Ensure `locked` colors from the current state are injected as fixed centroids or preserved during recalculation.
- [x] **Three-Pane Viewport UI**
    - **Pane 1:** Filtered Original (Canvas).
    - **Pane 2:** Indexed Result (Canvas where pixels are mapped to the nearest palette color).
    - **Pane 3:** Palette Sidebar (Mantine Stack).

---

## 🖱️ Phase 4: Feature: The 'Painter's Sampler'
- [x] **Sampler Mode Toggle**
    - Create a global "Sampling" state that changes the cursor to a circle.
- [x] **Circular Overlay UI**
    - Render a dynamic SVG or Canvas overlay that follows the mouse with a configurable radius (1-100px).
- [x] **Area Average Calculation**
    - Calculate the mean RGBA of all pixels inside the circle area on the *Filtered Canvas*.
- [x] **Real-time Remapping**
    - On click, update the selected `Color` object.
    - Trigger an immediate re-render of the "Indexed Result" canvas using the updated palette.

---

## 🧪 Phase 5: Subtractive Mixing & Pigment Engine
- [x] **Reference Pigment Dictionary**
    - Hardcode the 11 provided pigments with their hex codes.
- [x] **Subtractive Mix Algorithm**
    - Use `chroma-js` to convert hex to LAB/CMYK.
    - Implement an approximation algorithm to find which 2-3 pigments (plus White/Black) best match the target color.
- [x] **Recipe Formatter**
    - Convert mathematical ratios into "Parts" (e.g., "3 parts Cadmium Red, 1 part Raw Umber").

---

## 📄 Phase 6: PDF Export & Optimization
- [x] **jsPDF Report Builder**
    - Auto-generate a document containing:
        - Project Title & Date.
        - Side-by-side Image Comparison.
        - High-res Swatches with Hex codes and "Mix Recipes."
- [x] **Performance Pass**
    - Implement `300ms` debounce on all sliders using `use-debounced-value`.
    - Use `Web Workers` for K-Means if large images cause UI freezing.
- [x] **Notifications Integration**
    - Add Mantine notifications for "Image Processed," "Project Saved," and "Export Complete."

---

## 🏁 Phase 7: Polish & Documentation
- [x] **Keyboard Shortcuts**
    - `Esc` to exit Sample Mode.
    - `Ctrl+S` to save project.
- [x] **Empty States**
    - Design "Upload an Image to Start" placeholder UI.
