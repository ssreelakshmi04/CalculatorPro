document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const numberButtons = document.querySelectorAll('.number');
    const operatorButtons = document.querySelectorAll('.operator');
    const clearButton = document.getElementById('clear');
    const equalsButton = document.getElementById('equals');
    const viewHistoryButton = document.getElementById('viewHistory');
    const historySection = document.getElementById('history-section');
    const historyDisplay = document.getElementById('history-display');

    let currentExpression = '';
    const calcHistory = []; // Using 'history' as per prompt for local variable, not global window.history

    const updateDisplay = () => {
        display.value = currentExpression === '' ? '0' : currentExpression;
    };

    const isOperator = (char) => ['+', '-', '*', '/'].includes(char);

    const appendNumber = (number) => {
        if (display.value === 'Error' || display.value === 'Syntax Error') {
            currentExpression = '';
        }

        if (currentExpression === '' && number === '.') {
            currentExpression = '0.';
        } else if (currentExpression === '0' && number !== '.') {
            currentExpression = number;
        } else if (number === '.') {
            const parts = currentExpression.split(/[\+\-\*\/]/);
            const lastPart = parts[parts.length - 1];
            if (lastPart.includes('.')) {
                return; // Prevent multiple decimals in one number
            }
            if (lastPart === '') { // If last part is an operator, add '0.'
                currentExpression += '0.';
            } else {
                currentExpression += number;
            }
        } else {
            currentExpression += number;
        }
        updateDisplay();
    };

    const appendOperator = (operator) => {
        if (display.value === 'Error' || display.value === 'Syntax Error') {
            currentExpression = ''; // Clear error state
        }
        
        if (currentExpression === '' && operator === '-') {
            currentExpression = '-';
        } else if (currentExpression === '' && isOperator(operator)) {
            return; // Cannot start with an operator other than '-'
        } else if (currentExpression.length > 0 && isOperator(currentExpression[currentExpression.length - 1])) {
            // Replace last operator if consecutive
            currentExpression = currentExpression.slice(0, -1) + operator;
        } else {
            currentExpression += operator;
        }
        updateDisplay();
    };

    const clearDisplay = () => {
        currentExpression = '';
        updateDisplay();
    };

    const calculate = async () => {
        if (currentExpression === '' || display.value === 'Error' || display.value === 'Syntax Error') {
            return;
        }

        const expressionToSend = currentExpression;

        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ expression: expressionToSend }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                display.value = errorData.error || 'Network Error';
                currentExpression = '';
                return;
            }

            const data = await response.json();

            if (data.result !== undefined) {
                calcHistory.push({ expression: expressionToSend, result: data.result });
                display.value = data.result;
                currentExpression = data.result.toString(); // For chaining operations
                if (historySection.style.display === 'block') {
                    updateHistoryDisplay();
                }
            } else if (data.error) {
                display.value = data.error;
                currentExpression = '';
            }
        } catch (error) {
            console.error('Calculation error:', error);
            display.value = 'Error';
            currentExpression = '';
        }
    };

    const toggleHistoryVisibility = () => {
        if (historySection.style.display === 'block') {
            historySection.style.display = 'none';
        } else {
            historySection.style.display = 'block';
            updateHistoryDisplay();
        }
    };

    const updateHistoryDisplay = () => {
        historyDisplay.innerHTML = '';
        if (calcHistory.length === 0) {
            const noHistory = document.createElement('p');
            noHistory.textContent = 'No history yet.';
            historyDisplay.appendChild(noHistory);
        } else {
            calcHistory.forEach(entry => {
                const historyItem = document.createElement('p');
                historyItem.classList.add('history-item');
                historyItem.textContent = `${entry.expression} = ${entry.result}`;
                historyDisplay.appendChild(historyItem);
            });
        }
    };

    // Initialize display
    updateDisplay();

    // Event Listeners
    numberButtons.forEach(button => {
        button.addEventListener('click', () => appendNumber(button.dataset.value));
    });

    operatorButtons.forEach(button => {
        button.addEventListener('click', () => appendOperator(button.dataset.value));
    });

    clearButton.addEventListener('click', clearDisplay);
    equalsButton.addEventListener('click', calculate);
    viewHistoryButton.addEventListener('click', toggleHistoryVisibility);

    document.addEventListener('keydown', (event) => {
        const key = event.key;

        if (/[0-9]/.test(key)) {
            appendNumber(key);
        } else if (['+', '-', '*', '/'].includes(key)) {
            appendOperator(key);
        } else if (key === '.') {
            appendNumber('.');
        } else if (key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if any
            calculate();
        } else if (key === 'Backspace') {
            if (currentExpression.length > 0) {
                currentExpression = currentExpression.slice(0, -1);
                updateDisplay();
            } else {
                clearDisplay(); // If nothing, clear to '0'
            }
        } else if (key === 'Escape') {
            clearDisplay();
        }
    });
});