/**
 * FixMyPrompt - InputMonitor Component
 * Real-time input monitoring with pause and focus detection
 * v0.1.0 feature: Detects when user pauses typing (1.0s) or loses focus
 */

class InputMonitor {
    constructor(inputElement, options = {}) {
        this.inputElement = inputElement;
        this.pauseThreshold = options.pauseThreshold || 1000; // 1.0 second
        this.listeners = {
            onPause: [],
            onFocusLoss: [],
            onInput: []
        };
        
        this.lastInputTime = 0;
        this.pauseTimer = null;
        this.isMonitoring = false;
        
        console.log('[InputMonitor] Created with pauseThreshold:', this.pauseThreshold);
    }
    
    /**
     * Start monitoring input element
     */
    start() {
        if (this.isMonitoring) {
            console.log('[InputMonitor] Already monitoring');
            return;
        }
        
        this.isMonitoring = true;
        console.log('[InputMonitor] Started monitoring');
        
        // Listen for input events (typing)
        this.inputElement.addEventListener('input', this.handleInput.bind(this));
        this.inputElement.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Listen for focus loss
        this.inputElement.addEventListener('blur', this.handleFocusLoss.bind(this));
        
        // Listen for paste events
        this.inputElement.addEventListener('paste', this.handleInput.bind(this));
    }
    
    /**
     * Stop monitoring
     */
    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        clearTimeout(this.pauseTimer);
        console.log('[InputMonitor] Stopped monitoring');
    }
    
    /**
     * Handle input/typing events
     */
    handleInput(event) {
        this.lastInputTime = Date.now();
        
        // Clear existing pause timer
        clearTimeout(this.pauseTimer);
        
        // Get current text
        const text = this.getInputText();
        console.log('[InputMonitor] Input detected, text length:', text.length);
        
        // Emit input event
        this.emit('onInput', { text, length: text.length });
        
        // Set new pause timer
        this.pauseTimer = setTimeout(() => {
            this.handlePause();
        }, this.pauseThreshold);
    }
    
    /**
     * Handle keydown events (for special keys)
     */
    handleKeydown(event) {
        // Reset pause timer on any keydown
        clearTimeout(this.pauseTimer);
        this.lastInputTime = Date.now();
        
        // Set new pause timer
        this.pauseTimer = setTimeout(() => {
            this.handlePause();
        }, this.pauseThreshold);
    }
    
    /**
     * Handle pause detection (1.0s of no typing)
     */
    handlePause() {
        const text = this.getInputText();
        if (text.length === 0) {
            console.log('[InputMonitor] Pause detected but input is empty, skipping');
            return;
        }
        
        console.log('[InputMonitor] Pause detected after', this.pauseThreshold, 'ms');
        this.emit('onPause', { text, length: text.length, timestamp: Date.now() });
    }
    
    /**
     * Handle focus loss (immediate trigger)
     */
    handleFocusLoss(event) {
        const text = this.getInputText();
        if (text.length === 0) {
            console.log('[InputMonitor] Focus loss detected but input is empty, skipping');
            return;
        }
        
        // Clear pause timer when focus is lost
        clearTimeout(this.pauseTimer);
        
        console.log('[InputMonitor] Focus loss detected, text length:', text.length);
        this.emit('onFocusLoss', { text, length: text.length, timestamp: Date.now() });
    }
    
    /**
     * Get current input text
     */
    getInputText() {
        if (!this.inputElement) return '';
        
        // Handle contenteditable divs
        if (this.inputElement.contentEditable === 'true') {
            return this.inputElement.textContent || '';
        }
        
        // Handle textarea
        return this.inputElement.value || '';
    }
    
    /**
     * Register event listener
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
            console.log(`[InputMonitor] Registered listener for ${event}`);
        }
    }
    
    /**
     * Unregister event listener
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Emit event to all registered listeners
     */
    emit(event, data) {
        if (this.listeners[event]) {
            console.log(`[InputMonitor] Emitting ${event} with data:`, data);
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[InputMonitor] Error in ${event} listener:`, error);
                }
            });
        }
    }
    
    /**
     * Clear all listeners
     */
    clearListeners() {
        this.listeners = {
            onPause: [],
            onFocusLoss: [],
            onInput: []
        };
    }
}

export { InputMonitor };
