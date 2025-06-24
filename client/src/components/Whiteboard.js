import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import * as fabric from 'fabric';
import jsPDF from 'jspdf';

const socket = io('http://localhost:3001');

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [isEditable, setIsEditable] = useState(true);

  const undoStack = useRef([]);
  const redoStack = useRef([]);

  useEffect(() => {
    const username = localStorage.getItem('username');
    const roomId = localStorage.getItem('roomId');
    socket.emit('join-room', { roomId, username });

    const existingCanvas = fabric.Canvas && fabric.Canvas.instances?.[0];
    if (existingCanvas) existingCanvas.dispose();

    const newCanvas = new fabric.Canvas('whiteboard', {
      isDrawingMode: false,
      selection: isEditable,
    });

    newCanvas.setHeight(window.innerHeight - 70);
    newCanvas.setWidth(window.innerWidth);

    const resizeCanvas = () => {
      newCanvas.setHeight(window.innerHeight - 70);
      newCanvas.setWidth(window.innerWidth);
      newCanvas.renderAll();
    };

    window.addEventListener('resize', resizeCanvas);

    if (!isEditable) newCanvas.selection = false;

    setCanvas(newCanvas);

    socket.on('drawing', (data) => {
      if (data?.type === 'clear') {
        newCanvas.clear();
        return;
      }
      fabric.util.enlivenObjects([data], ([obj]) => {
        obj.selectable = false;
        newCanvas.add(obj);
        newCanvas.renderAll();
      });
    });

    const saveState = () => {
      undoStack.current.push(JSON.stringify(newCanvas.toJSON()));
      redoStack.current = [];
    };

    newCanvas.on('object:added', saveState);
    newCanvas.on('object:modified', saveState);
    newCanvas.on('object:removed', saveState);

    return () => {
      socket.off('drawing');
      newCanvas.dispose();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isEditable]);

  const sendDrawing = (object) => {
    const roomId = localStorage.getItem('roomId');
    const data = object.toObject();
    socket.emit('drawing', { roomId, data });
  };

  const addShape = (type) => {
    if (!canvas || !isEditable) return;
    let shape;
    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          width: 120, height: 80, fill: 'white', stroke: 'black', strokeWidth: 2, left: 100, top: 100
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          radius: 50, fill: 'white', stroke: 'black', strokeWidth: 2, left: 150, top: 150
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          width: 100, height: 100, fill: 'white', stroke: 'black', strokeWidth: 2, left: 200, top: 200
        });
        break;
      case 'line':
        shape = new fabric.Line([50, 100, 200, 100], {
          stroke: 'black', strokeWidth: 2
        });
        break;
      default:
        return;
    }
    canvas.add(shape);
    sendDrawing(shape);
  };

  const enablePen = () => {
    if (canvas) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = 'black';
      canvas.freeDrawingBrush.width = 5;
    }
  };

  const enableEraser = () => {
    if (canvas) {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = 10;
    }
  };

  const addText = () => {
    if (!canvas || !isEditable) return;
    canvas.isDrawingMode = false;
    const text = new fabric.IText('Enter text here', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: 'black',
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    sendDrawing(text);
  };

  const undo = () => {
    if (!canvas || undoStack.current.length === 0) return;
    redoStack.current.push(JSON.stringify(canvas.toJSON()));
    const last = undoStack.current.pop();
    canvas.loadFromJSON(last, () => canvas.renderAll());
  };

  const redo = () => {
    if (!canvas || redoStack.current.length === 0) return;
    undoStack.current.push(JSON.stringify(canvas.toJSON()));
    const last = redoStack.current.pop();
    canvas.loadFromJSON(last, () => canvas.renderAll());
  };

  const clearCanvas = () => {
    canvas.clear();
    if (!isEditable) canvas.selection = false;
    sendDrawing({ toObject: () => ({ type: 'clear' }) });
  };

  const exportAsImage = () => {
    const dataURL = canvas.toDataURL({ format: 'png' });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'whiteboard.png';
    link.click();
  };

  const exportAsPDF = () => {
    const dataURL = canvas.toDataURL({ format: 'png' });
    const pdf = new jsPDF();
    pdf.addImage(dataURL, 'PNG', 10, 10, 180, 100);
    pdf.save('whiteboard.pdf');
  };

  return (
    <div>
      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px', background: '#f4f4f4' }}>
        <button onClick={() => setIsEditable(true)} style={{ backgroundColor: '#2196F3', color: 'white' }}>Edit</button>
        <button onClick={() => setIsEditable(false)} style={{ backgroundColor: '#607D8B', color: 'white' }}>View</button>

        <button style={{ backgroundColor: '#4CAF50', color: 'white' }} onClick={enablePen} disabled={!isEditable}>Pen</button>
        <button style={{ backgroundColor: '#f44336', color: 'white' }} onClick={enableEraser} disabled={!isEditable}>Eraser</button>
        <button style={{ backgroundColor: '#3F51B5', color: 'white' }} onClick={addText} disabled={!isEditable}>Text</button>

        <input type="color" onChange={(e) => {
          if (canvas && canvas.isDrawingMode && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = e.target.value;
          }
        }} />

        <input type="range" min="1" max="50" onChange={(e) => {
          if (canvas && canvas.isDrawingMode && canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.width = parseInt(e.target.value);
          } else {
            alert('Please enable the Pen tool first');
          }
        }} />

        <label>Shape:</label>
        <select onChange={(e) => addShape(e.target.value)} disabled={!isEditable}>
          <option value="">Select</option>
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
          <option value="triangle">Triangle</option>
          <option value="line">Line</option>
        </select>

        <button style={{ backgroundColor: '#FF9800', color: 'white' }} onClick={undo} disabled={!isEditable}>Undo</button>
        <button style={{ backgroundColor: '#FF5722', color: 'white' }} onClick={redo} disabled={!isEditable}>Redo</button>
        <button style={{ backgroundColor: '#9E9E9E', color: 'white' }} onClick={clearCanvas} disabled={!isEditable}>Clear</button>
        <button style={{ backgroundColor: '#009688', color: 'white' }} onClick={exportAsImage}>Export PNG</button>
        <button style={{ backgroundColor: '#673AB7', color: 'white' }} onClick={exportAsPDF}>Export PDF</button>
      </div>

      <canvas id="whiteboard" ref={canvasRef} />
    </div>
  );
};

export default Whiteboard;
