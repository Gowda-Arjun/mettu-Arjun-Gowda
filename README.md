# mettu - a Static Site Generator using Python and Vite

mettu (మెట్లు, /ˈmɛt.t̪u/) is a simple static site generator that uses Python for backend processing and Vite for frontend development, with Tailwind and DaisyUI for styling. It allows you to create static websites using markdown files.

## Why the name?
"mettu" is a Telugu word meaning a stair or step. It felt like a great name given that this project is a step towards building tools myself, and convieniently, a step towards making a site!

## Requirements
- Python 3.x
- Node.js and npm
- Vite
- Tailwind CSS and DaisyUI

## Setup
1. Clone the repository
2. Install the required dependencies

   ```bash
   npm install
   ```

   - Note: Python dependencies are installed by default by the initialising script.

3. Edit the `config.yaml` file to set your site name, author, runtime configuration, navigation links, syntax highlighting theme, and DaisyUI theme preferences.

   ```yaml
   runtime:
      python_executable: "python3"    # optional, defaults to python3 when omitted
   theme:
     default: "cupcake"                # active theme used for data-theme
     include: ["cupcake", "dracula"]  # DaisyUI presets to load
     custom:
       mytheme:
         primary: "#570df8"
         secondary: "#f000b8"
         accent: "#37cdbe"
   ```

    Optionally, define site-wide font imports and the families to apply:

    ```yaml
    fonts:
       imports:
          - "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@500;700&display=swap"
       families:
          body: "'Inter', sans-serif"
          heading: "'Space Grotesk', sans-serif"
          mono: "'JetBrains Mono', monospace"

    syntax:
       pygments_theme: "dracula"   # Controls syntax.css and markdown highlighting
    ```

   You can still override the interpreter via the `PY_EXECUTABLE` environment variable if needed, but the config file is the canonical source.

4. Create markdown files in the `content` directory. Each file should start similarly to the given examples.
5. Templates and svg icons are located in the `templates` directory. You can customize them as needed.
6. Assets like css, images, etc are placed in the `assets` directory.
7. Run the development server

   ```bash
   npm run dev
   ```

8. Build the site for production

   ```bash
   npm run build
   ```
