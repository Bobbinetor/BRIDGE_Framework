#!/bin/bash

# Create the main directories
mkdir -p static/css static/js static/images templates

# Create the files
touch app.py
touch static/css/style.css
touch static/js/main.js
touch templates/index.html
touch requirements.txt

# Output the created structure
echo "Created the following structure:"
echo "├── app.py"
echo "├── static/"
echo "│   ├── css/"
echo "│   │   └── style.css"
echo "│   ├── js/"
echo "│   │   └── main.js"
echo "│   └── images/"
echo "├── templates/"
echo "│   └── index.html"
echo "└── requirements.txt"