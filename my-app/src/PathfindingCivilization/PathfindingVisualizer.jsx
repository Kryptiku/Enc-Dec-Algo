import React, { Component } from "react";
import Howler from 'react-howler';
import { Howl } from 'howler';
import DropdownList from "react-widgets/DropdownList";
import Node from "./Node/Node";
import { dijkstra, getNodesInShortestPathOrder } from "../algorithms/dijkstra";
import { aStar } from "../algorithms/aStar";
import "./PathfindingVisualizer.css";
import "react-widgets/styles.css";
import './DropdownList.scss';
import BgMusic from '../assets/Sweden.mp3';
import MusicOnIcon from '../assets/musicon.png';
import MusicOffIcon from '../assets/musicoff.png';
import PlaceWallSound from '../assets/Stone_dig1.ogg';
import BreakSound from '../assets/Random_break.ogg';

const START_NODE_ROW = 10;
const START_NODE_COL = 15;
const FINISH_NODE_ROW = 10;
const FINISH_NODE_COL = 35;
const algorithms = ['Dijkstra', 'A*'];

export default class PathfindingVisualizer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      grid: [],
      mouseIsPressed: false,
      buttonDisabled: false,
      selectedAlgorithm: null,
      isDropdownOpen: false,
      isMusicPlaying: false,
    };
  }

    componentDidMount() {
      const grid = getInitialGrid();
      this.setState({ grid });
    }

  clearGrid(alsoWall) {
    const { grid } = this.state;

    const newGrid = grid.map((row) =>
      row.map((node) => {
        const baseNode = {
          ...node,
          isVisited: false,
          isWall: false,
          distance: Infinity,
          previousNode: null,
          heuristic: 0,
          fCost: Infinity,
        };

        if (!alsoWall && node.isWall) {
          baseNode.isWall = true;
        }

        return node.isStart || node.isFinish ? baseNode : baseNode;
      })
    );

    this.setState({ grid: newGrid });

    newGrid.forEach((row, rowIndex) => {
      row.forEach((node, colIndex) => {
        const nodeElement = document.getElementById(
          `node-${rowIndex}-${colIndex}`
        );
        if (nodeElement) {
          if (alsoWall) {
            nodeElement.className = `node ${
              node.isStart ? "node-start" : node.isFinish ? "node-finish" : ""
            }`.trim();
          } else {
            nodeElement.className = `node ${
              node.isStart
                ? "node-start"
                : node.isFinish
                ? "node-finish"
                : node.isWall
                ? "node-wall"
                : ""
            }`.trim();
          }
        }
      });
    });
  }

  playClearSound = () => {
    const clearSound = new Howl({
      src: [BreakSound],
      volume: 1,
    });
    clearSound.play();
  }

  handleMouseDown(row, col) {
    const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
    this.setState({ grid: newGrid, mouseIsPressed: true });
    this.playWallSound();
  }

  handleMouseEnter(row, col) {
    if (!this.state.mouseIsPressed) return;
    const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
    this.setState({ grid: newGrid });
    this.playWallSound();
  }

  handleMouseUp() {
    this.setState({ mouseIsPressed: false });
  }

  playWallSound = () => {
    const wallSound = new Howl({
      src: [PlaceWallSound],
      volume: 1,
    });
    wallSound.play();
  };

  animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-visited";
      }, 10 * i);
      this.setState({isAlgoRunning: false})
    }
  }

  animateShortestPath(nodesInShortestPathOrder) {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        document.getElementById(`node-${node.row}-${node.col}`).className =
          "node node-shortest-path";
      }, 50 * i);
    }
  }

  visualize(algorithm) {
    const { selectedAlgorithm } = this.state;

    if (!selectedAlgorithm) {
      const descriptionElement = document.getElementById('algo_description');
      if (descriptionElement) {
        descriptionElement.classList.add('shake');
        setTimeout(() => {
          descriptionElement.classList.remove('shake');
        }, 300);
      }
      return;
    }

    this.setState({ buttonDisabled: true });
    this.clearGrid(false);
    
    const { grid } = this.state;
    const startNode = grid[START_NODE_ROW][START_NODE_COL];
    const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
    let visitedNodesInOrder;
    
    switch (algorithm) {
      case 'A*':
        visitedNodesInOrder = aStar(grid, startNode, finishNode);
        break;
      case 'Dijkstra':
        visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
        break;
      default:
        return;
    }
  
    const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
    this.animateAlgorithm(visitedNodesInOrder, nodesInShortestPathOrder);
    
    setTimeout(() => {
      this.setState({ buttonDisabled: false });
    }, 10 * visitedNodesInOrder.length + 50 * nodesInShortestPathOrder.length);
  }

  getAlgorithmDescription = (algorithm) => {
    switch (algorithm) {
      case 'A*':
        return (
          <div>
            <h1 class="sign">A* Algorithm</h1>
            <p class="sign">A* uses heuristics to find the shortest path efficiently.</p>
          </div>
        );
      case 'Dijkstra':
        return (
          <div>
            <h1 class="sign">Dijkstra's Algorithm</h1>
            <p class="sign">Dijkstra's algorithm explores all possible paths to find the shortest one.</p>
          </div>
        );
      default:
        return <h1 class="sign">Pick an Algorithm:</h1>;
    }
  };

  handleChange = (value) => {
    this.setState({ selectedAlgorithm: value, isDropdownOpen: false });  // passes value to selectedAlgorithm and makes sure dropdown closes
  };
  

  handleDropdownToggle = () => {
    this.setState((prevState) => ({
      isDropdownOpen: !prevState.isDropdownOpen, // toggle dropdownlist visibility
    }));
  };

  handleClickOutside = (event) => {
    const dropdownList = document.getElementById('dropdown-list');
    if (dropdownList && !dropdownList.contains(event.target)) {
      this.setState({ isDropdownOpen: false });   // close dropdownlist if clicking outside
    }
  };

  componentDidUpdate(_, prevState) {
    if (prevState.isDropdownOpen !== this.state.isDropdownOpen) {

      // detect outside click
      if (this.state.isDropdownOpen) {
        document.addEventListener('click', this.handleClickOutside);
      } else {
        document.removeEventListener('click', this.handleClickOutside);
      }
    }
    const dropdownToggle = document.querySelector('.rw-dropdown-toggle');
    if (dropdownToggle) {
      dropdownToggle.removeAttribute('aria-hidden');
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }

  toggleMusic = () => {
    this.setState((prevState) => ({
      isMusicPlaying: !prevState.isMusicPlaying,
    }));
  };

  render() {
    const {
      grid,
      mouseIsPressed, 
      selectedAlgorithm, 
      isDropdownOpen, 
      isMusicPlaying 
    } = this.state;

    return (
      <>
        <div id="controls">
          <div id="dropdown-container">
            <DropdownList
              id="dropdown-list"
              data={algorithms}
              value={selectedAlgorithm || "Algorithms:"}
              onChange={this.handleChange}  
              open={isDropdownOpen}
              onToggle={this.handleDropdownToggle} // toggle dropdown visibility manually
            />
          </div>
          <button
            onClick={() => this.visualize(selectedAlgorithm)}
            style={{
              backgroundColor: this.state.buttonDisabled ? 'red' : '#87A330',
              cursor: this.state.buttonDisabled ? 'not-allowed' : 'pointer'
            }}
            disabled = {this.state.buttonDisabled}
          >
            Visualize {selectedAlgorithm}
          </button>
          <button 
            onClick={() => {
              this.playClearSound();
              this.clearGrid(true);
            }}
            style={{
              cursor: this.state.buttonDisabled ? 'not-allowed' : 'pointer'
            }}
            disabled = {this.state.buttonDisabled}
          >Clear Grid</button>
          <button 
            onClick={() => {
              this.playClearSound();  // Call function to play sound
              this.clearGrid(false);   // Call function to clear the grid
            }}
            style={{
              cursor: this.state.buttonDisabled ? 'not-allowed' : 'pointer'
            }}
            disabled = {this.state.buttonDisabled}
          >Clear Path</button>
          <button onClick={this.toggleMusic}>
            <img
              src={isMusicPlaying ? MusicOnIcon : MusicOffIcon}
              alt={isMusicPlaying ? 'Music On' : 'Music Off'}
              style={{ width: '24px', height: '24px' }}
            />
          </button>
          <Howler src={BgMusic} playing={isMusicPlaying} volume={1} loop />
        </div>
        <div id="algo_description_container">
          <div id="algo_description">
            {this.getAlgorithmDescription(selectedAlgorithm)}
          </div>
        </div>
        <div id="gridcontainer">
          <div className="grid">
            {grid.map((row, rowIdx) => {
              return (
                <div key={rowIdx}>
                  {row.map((node, nodeIdx) => {
                    const {
                      isStart,
                      isFinish,
                      row,
                      col,
                      isWall,
                      heuristic,
                      fCost,
                    } = node;
                    return (
                      <Node
                        key={nodeIdx}
                        col={col}
                        fCost={fCost}
                        heuristic={heuristic}
                        isFinish={isFinish}
                        isStart={isStart}
                        isWall={isWall}
                        mouseIsPressed={mouseIsPressed}
                        onMouseDown={(row, col) => {
                          if (!isStart && !isFinish) {
                            this.handleMouseDown(row, col);
                          }
                        }}
                        onMouseEnter={(row, col) => {
                          if (!isStart && !isFinish) {
                            this.handleMouseEnter(row, col);
                          }
                        }}
                        onMouseUp={() => this.handleMouseUp()}
                        row={row}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }
}

const getInitialGrid = () => {
  const grid = [];
  for (let row = 0; row < 20; row++) {
    const currentRow = [];
    for (let col = 0; col < 50; col++) {
      currentRow.push(createNode(row, col));
    }
    grid.push(currentRow);
  }
  return grid;
};

const createNode = (row, col) => {
  return {
    row,
    col,
    isStart: row === START_NODE_ROW && col === START_NODE_COL,
    isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
    isWall: false,
    distance: Infinity,
    isVisited: false,
    previousNode: null,
    heuristic: 0,
    fCost: Infinity,
  };
};

const getNewGridWithWallToggled = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  const newNode = {
    ...node,
    isWall: !node.isWall,
  };
  newGrid[row][col] = newNode;
  return newGrid;
};
