### Setting Up the Application:

- Clone or download the project from GitHub.
- Navigate to the project folder in the terminal.
- Run npm install to install all required dependencies.
- Launch the application with npm start.

---

**Image Optimizer Application**

**Overview:**
This desktop application provides users with tools to optimize their image files. The optimization can be based on resizing by percentages or converting images to different formats, particularly the `.webp` format, which often results in smaller file sizes.

**Features:**

1. **Resize Single Image**
   - Allows the user to select a single image and resize it by an inputted percentage.
   - Renames the original image with a prefix "old_" and saves the resized image with the original filename.

2. **Resize All Images in a Directory**
   - Lets users select a directory, and the application resizes all image files (`.jpg`, `.png`, `.gif`) in that directory based on a user-specified percentage.
   - Renames the original images with a prefix "old_" and saves the resized images with their original filenames.

3. **Resize Large Images in a Directory**
   - This function is more selective. It resizes images (`.jpg`, `.png`, `.gif`) that exceed specified size and dimension thresholds.
   - Users specify a percentage for resizing, a size threshold in KB, and a dimension threshold in pixels.
   - Renames the original images that meet the criteria with a prefix "old_" and saves the resized versions with their original filenames.

4. **Convert Single Image to WebP Format**
   - Users can select an individual image file, which will then be converted to the `.webp` format.

5. **Convert All Images in a Directory to WebP Format**
   - Converts all image files (`.jpg`, `.png`, `.gif`) in a chosen directory to the `.webp` format.

6. **Resize .webp Images in a Directory**
   - Allows the user to resize all `.webp` image files in a selected directory based on a user-defined percentage.
   - Original `.webp` files are renamed with the prefix "old_" and the resized versions are saved with the original filenames.

**Note:** All resized or converted images are saved in the same directory as the original images. The original images are renamed with the "old_" prefix to differentiate them from the optimized versions.

---

