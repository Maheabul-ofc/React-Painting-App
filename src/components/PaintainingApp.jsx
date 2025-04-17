import React from "react";
import { useState, useRef, useEffect } from "react";

function PaintainingApp() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [brushType, setBrushType] = useState('round');
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);


   // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set initial canvas properties
    context.lineCap = brushType; 
    context.lineJoin = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;

    // Fill with white background so canvas isn't transparent
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    saveState(); 
  },[]);

    // Update canvas properties when brush settings change
    useEffect(() => {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      context.lineCap = brushType;
    }, [color, brushSize, brushType]);

    // Start drawing when mouse is pressed
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect(); // Get canvas position in viewport
    
    // Calculate mouse position relative to canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  // Continue drawing as mouse moves (only if isDrawing is true)
  const draw = (e) => {
    if (!isDrawing) return; 
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    context.lineTo(x, y);  // Draw line to current mouse position
    context.stroke();      // Render the line
  };

   // Stop drawing when mouse is released or leaves canvas
   const stopDrawing = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    context.closePath();   // Close the current path
    setIsDrawing(false);   // Set drawing state to false
    
    // Save current state for undo functionality
    saveState();
  };

  // Save the current canvas state to history array
  const saveState = () => {
    const canvas = canvasRef.current;
    setHistory([...history, canvas.toDataURL()]);
    setRedoStack([]);
  };

  // Undo last drawing action
  const undo = () => {
    if (history.length <= 1) return;

    const lastState = history[history.length - 2];
    setRedoStack([...redoStack, history[history.length - 1]]);
    setHistory(history.slice(0, -1));

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
    };

    image.src = lastState;  
  };

  // Redo previously undone action
  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setHistory([...history, nextState]);
    setRedoStack(redoStack.slice(0, -1));

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
    };
    
    image.src = nextState;
  };

   // Clear canvas and return to blank state
   const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveState();  // Save the cleared state to history
  };


  // Download current canvas as PNG image
  const downloadImage = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create a virtual link and trigger download
    const link = document.createElement('a');
    link.download = 'my-painting.png';
    link.href = dataUrl;
    link.click();
  };


  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-4">React Painting App</h1>

      <div className="flex flex-col flex-wrap gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="color" className="mr-2">
            Color:
          </label>
          <input
            type="color"
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 cursor-pointer"
          />
        </div>

        <div className="flex items-center">
          <input
            type="range"
            id="brushSize"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="ml-2">{brushSize}px</span>
        </div>

        <div className="flex items-center">
          <label htmlFor="brushType" className="mr-2">
            Brush Type:
          </label>
          <select
            id="brushType"
            value={brushType}
            onChange={(e) => setBrushType(e.target.value)}
            className="p-1 border rounded"
          >
            <option value="round">Round</option>
            <option value="square">Square</option>
            <option value="butt">Flat</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={undo}
          disabled={history.length <= 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Redo
        </button>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Clear
        </button>
        <button
          onClick={downloadImage}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Download
        </button>
      </div>

      <div className="border-4 border-gray-400 rounded-lg shadow-lg">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="bg-white cursor-crosshair"
        />
      </div>

      <div className="mt-4 text-gray-600">
        Current tool: Brush ({brushSize}px, {brushType}, {color})
      </div>
    </div>
  );
}

export default PaintainingApp;
