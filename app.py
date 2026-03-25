import os
from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    expression = data.get('expression', '')

    if not expression:
        return jsonify({'error': 'No expression provided'}), 400

    try:
        # Security note: Using eval() with arbitrary user input is dangerous.
        # For a production application, a dedicated, safe math expression parser
        # should be used instead. This implementation is for demonstration
        # purposes as requested, with basic error handling.
        result = eval(expression)
        return jsonify({'result': result})
    except SyntaxError:
        return jsonify({'error': 'Invalid expression format'}), 400
    except ZeroDivisionError:
        return jsonify({'error': 'Division by zero'}), 400
    except Exception as e:
        # Catch other potential errors during evaluation
        return jsonify({'error': f'Calculation error: {str(e)}'}), 400



@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(".", filename)

if __name__ == '__main__':
    app.run(debug=True, port=int(os.environ.get("PORT", 5000)))