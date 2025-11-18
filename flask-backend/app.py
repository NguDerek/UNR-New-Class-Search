from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return "Flask is installed and running smoothly!"

if __name__ == '__main__':
    app.run(debug=True)
