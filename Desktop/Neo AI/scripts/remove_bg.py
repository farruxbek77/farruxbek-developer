import sys
from rembg import remove
from PIL import Image
import io

input_path = sys.argv[1]
output_path = sys.argv[2]

with open(input_path, "rb") as f:
    input_data = f.read()

output_data = remove(input_data)

with open(output_path, "wb") as f:
    f.write(output_data)
