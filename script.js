class StudentCalculator {
    constructor() {
        this.exprDisplay = document.getElementById('expressionDisplay');
        this.resDisplay = document.getElementById('resultDisplay');
        this.historyList = document.getElementById('historyList');
        this.container = document.querySelector('.calculator-container');
        
        this.expression = '';
        this.currentInput = '';
        this.history = [];
        this.isEvaluated = false;

        this.initEvents();
    }

    initEvents() {
        // Tab / Mode Switching Control
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.tab;
                
                // Toggle CSS layout flags
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                if (mode === 'scientific') {
                    this.container.classList.add('scientific-mode');
                    this.container.classList.remove('history-open');
                } else if (mode === 'history') {
                    this.container.classList.add('history-open');
                } else {
                    this.container.classList.remove('scientific-mode', 'history-open');
                }
            });
        });

        // Keypad Interactions
        document.querySelector('.keypad').addEventListener('click', (e) => {
            const button = e.target.closest('.key');
            if (!button) return;

            const num = button.textContent;
            const action = button.dataset.action;

            if (action) {
                this.handleAction(action);
            } else {
                this.appendNumber(num);
            }
            this.updateDisplay();
        });

        // Clean out history log
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.history = [];
            this.renderHistory();
        });
    }

    appendNumber(num) {
        if (this.isEvaluated) {
            this.expression = '';
            this.isEvaluated = false;
        }
        if (num === '.' && this.currentInput.includes('.')) return;
        
        this.expression += num;
        this.currentInput += num;
    }

    handleAction(action) {
        if (this.isEvaluated && !['add', 'subtract', 'multiply', 'divide', 'pow', 'percent'].includes(action)) {
            this.expression = '';
            this.isEvaluated = false;
        }

        this.currentInput = '';

        switch (action) {
            case 'clear':
                this.expression = '';
                this.resDisplay.textContent = '0';
                break;
            case 'backspace':
                this.expression = this.expression.slice(0, -1);
                break;
            case 'add': this.expression += ' + '; break;
            case 'subtract': this.expression += ' − '; break;
            case 'multiply': this.expression += ' × '; break;
            case 'divide': this.expression += ' ÷ '; break;
            case 'parenthesis-open': this.expression += '('; break;
            case 'parenthesis-close': this.expression += ')'; break;
            case 'percent': this.expression += '%'; break;
            case 'pi': this.expression += 'π'; break;
            
            // Advanced student equations structures
            case 'pow': this.expression += '^'; break;
            case 'sin': this.expression += 'sin('; break;
            case 'cos': this.expression += 'cos('; break;
            case 'tan': this.expression += 'tan('; break;
            case 'log': this.expression += 'log('; break;
            case 'ln': this.expression += 'ln('; break;
            case 'sqrt': this.expression += '√('; break;
            
            case 'equals':
                this.evaluate();
                break;
        }
    }

    evaluate() {
        if (!this.expression) return;
        let rawExpression = this.expression;

        // Parse human-readable mathematical symbols to JavaScript engine operators
        rawExpression = rawExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
        rawExpression = rawExpression.replace(/π/g, Math.PI);
        rawExpression = rawExpression.replace(/%/g, '*0.01');
        rawExpression = rawExpression.replace(/([0-9.]+)\^([0-9.]+)/g, 'Math.pow($1,$2)');

        // Math formulas evaluation parser
        rawExpression = rawExpression.replace(/sin\(/g, 'Math.sin(');
        rawExpression = rawExpression.replace(/cos\(/g, 'Math.cos(');
        rawExpression = rawExpression.replace(/tan\(/g, 'Math.tan(');
        rawExpression = rawExpression.replace(/log\(/g, 'Math.log10(');
        rawExpression = rawExpression.replace(/ln\(/g, 'Math.log(');
        rawExpression = rawExpression.replace(/√\(/g, 'Math.sqrt(');

        try {
            // Close any missing parentheses safely
            const openParentheses = (rawExpression.match(/\(/g) || []).length;
            const closeParentheses = (rawExpression.match(/\)/g) || []).length;
            if (openParentheses > closeParentheses) {
                rawExpression += ')'.repeat(openParentheses - closeParentheses);
            }

            let result = eval(rawExpression);

            if (isNaN(result) || !isFinite(result)) {
                this.resDisplay.textContent = 'Error';
                return;
            }

            // Fix precision floats issues
            result = parseFloat(result.toFixed(8));

            // Log item to calculation pipeline array
            this.history.unshift({ expr: this.expression, res: result });
            this.renderHistory();

            this.resDisplay.textContent = result;
            this.isEvaluated = true;
        } catch (error) {
            this.resDisplay.textContent = 'Syntax Error';
        }
    }

    updateDisplay() {
        this.exprDisplay.textContent = this.expression;
        if (!this.expression) {
            this.resDisplay.textContent = '0';
        }
    }

    renderHistory() {
        this.historyList.innerHTML = '';
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="empty-state">No history yet</div>';
            return;
        }

        this.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="hist-expr">${item.expr}</div>
                <div class="hist-res">${item.res}</div>
            `;
            div.addEventListener('click', () => {
                this.expression = item.res.toString();
                this.updateDisplay();
                this.resDisplay.textContent = item.res;
            });
            this.historyList.appendChild(div);
        });
    }
}

// Instantiate engine configuration on DOM layout completion
document.addEventListener('DOMContentLoaded', () => {
    window.calculator = new StudentCalculator();
    
    // Bind global enter keys to equals behavior 
    document.getElementById('equalsBtn').addEventListener('click', () => {
        window.calculator.evaluate();
    });
});
