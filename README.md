# Metalstorm Hangar Progression Calculator

The *Metalstorm Hangar Progression Calculator* is a web-based tool designed for *Metalstorm* players to plan hangar upgrades and track battle pass progress. It calculates the silver and battle pass tiers needed to reach a target hangar level and visualizes progression with charts. 

Hosted live at: https://mshangar.netlify.app/

## Features

- **Hangar Upgrade Calculator**: Input current hangar level, progress points, silver, and battle pass tier to calculate the points and silver needed for a target level.
- **Battle Pass Tracking**: Compare free and premium battle pass progress, including retroactive premium rewards.
- **Progression Chart**: Visualize cumulative silver requirements and shortfalls using an interactive line chart (powered by Chart.js).
- **Responsive Design**: Mobile-friendly layout with a clean, modern UI using CSS Grid and Flexbox.
- **Tabbed Interface**: Navigate between Calculator, Progression Chart, and Info & Help sections.
- **Tooltips and Info**: Detailed explanations of terms (e.g., silver shortfall, retroactive silver) and usage instructions.

## Technologies

- **HTML5**: Structure and content.
- **CSS3**: Styling with custom properties, responsive design, and animations.
- **JavaScript (ES6)**: Logic for calculations, DOM manipulation, and chart generation.
- **Chart.js (v3.9.1)**: Interactive line charts for progression visualization.
- **Netlify**: Hosting for the live site.

## Setup

To run the project locally or deploy it:

1. **Clone the Repository** (if hosted on GitHub or similar):

   ```bash
   git clone https://github.com/yaseen454/MSHangar.git
   cd MSHangar
   ```

2. **Ensure Files**:

   - `index.html`: Main HTML file with structure, styles, and scripts.
   - `favicon.ico`: Fighter plane favicon in the `data` folder (or root).
   - Ensure the `<link rel="icon" type="image/x-icon" href="data/favicon.ico">` in the `<head>` points to the correct path.

3. **Run Locally**:

   - Open `index.html` in a browser (e.g., Chrome) using a local server to avoid CORS issues with Chart.js:

     ```bash
     npx http-server
     ```

     Or use VS Code’s Live Server extension.
   - Alternatively, double-click `index.html` (Chart.js may not load due to local file restrictions).

4. **Deploy to Netlify** (optional):

   - Drag the project folder to Netlify’s Drop or connect via GitHub.
   - Ensure `favicon.ico` is included in the `data` folder for the favicon to display.

5. **Dependencies**:

   - No local dependencies required; Chart.js is loaded via CDN (`https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js`).

## Usage

1. **Calculator Tab**:

   - Enter your current hangar level (1–20), progress points, silver, battle pass tier (1–60), and target hangar level.
   - Click “Calculate” to see:
     - Points and silver needed.
     - Free and premium battle pass tiers required.
     - Silver shortfall and retroactive premium rewards.
   - View a progress bar for silver accumulation.

2. **Progression Chart Tab**:

   - Displays a line chart of cumulative points and silver shortfalls from your current level to level 20.
   - Includes a grid of hangar level requirements.

3. **Info & Help Tab**:

   - Learn how to use the calculator, understand free vs. premium battle pass benefits, and review terms like “silver shortfall.”

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

Please ensure code follows the existing style and includes tests if applicable.

## License

This project is open-source and available under the MIT License. Feel free to use, modify, and distribute it for non-commercial purposes.

## Acknowledgments

- Created by a fan for the *Metalstorm* community.
- Not affiliated with the official *Metalstorm* game or its developers.
- Thanks to Chart.js for charting capabilities and Netlify for hosting.

For issues or suggestions, open an issue on the GitHub repository or contact the maintainer.