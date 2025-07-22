document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const nextPiece = document.getElementById('next-piece');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const gameOverElement = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const finalLinesElement = document.getElementById('finalLines');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');

    // 游戏常量
    const COLS = 10;
    const ROWS = 20;
    const NEXT_PIECE_SIZE = 4;
    const SHAPES = [
        [[1, 1, 1, 1]], // I
        [[1, 1], [1, 1]], // O
        [[1, 1, 1], [0, 1, 0]], // T
        [[1, 1, 1], [1, 0, 0]], // L
        [[1, 1, 1], [0, 0, 1]], // J
        [[0, 1, 1], [1, 1, 0]], // S
        [[1, 1, 0], [0, 1, 1]]  // Z
    ];
    const COLORS = ['#00FFFF', '#FFFF00', '#800080', '#FFA500', '#0000FF', '#008000', '#FF0000'];

    // 游戏状态
    let boardGrid = [];
    let currentPiece = null;
    let currentPosition = { row: 0, col: 0 };
    let nextPieceShape = null;
    let score = 0;
    let lines = 0;
    let gameLoop = null;
    let isPaused = false;

    // 初始化游戏板
    function initializeBoard() {
        boardGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${COLS}, 30px)`;
        board.style.gridTemplateRows = `repeat(${ROWS}, 30px)`;

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                board.appendChild(cell);
            }
        }

        // 初始化下一个方块显示区域
        nextPiece.style.gridTemplateColumns = `repeat(${NEXT_PIECE_SIZE}, 30px)`;
        nextPiece.style.gridTemplateRows = `repeat(${NEXT_PIECE_SIZE}, 30px)`;
        nextPiece.innerHTML = '';
        for (let row = 0; row < NEXT_PIECE_SIZE; row++) {
            for (let col = 0; col < NEXT_PIECE_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                nextPiece.appendChild(cell);
            }
        }
    }

    // 创建随机方块
    function createPiece() {
        const type = Math.floor(Math.random() * SHAPES.length);
        return {
            shape: SHAPES[type],
            color: COLORS[type],
            type: type
        };
    }

    // 渲染游戏板
    function renderBoard() {
        // 清除之前的方块
        document.querySelectorAll('#board .cell').forEach(cell => {
            cell.className = 'cell';
        });

        // 渲染固定的方块
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (boardGrid[row][col]) {
                    const cell = board.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    cell.classList.add(boardGrid[row][col]);
                }
            }
        }

        // 渲染当前活动方块
        if (currentPiece) {
            currentPiece.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        const renderRow = currentPosition.row + rowIndex;
                        const renderCol = currentPosition.col + colIndex;
                        if (renderRow >= 0 && renderRow < ROWS && renderCol >= 0 && renderCol < COLS) {
                            const cellElement = board.querySelector(`[data-row="${renderRow}"][data-col="${renderCol}"]`);
                            cellElement.classList.add(currentPiece.color);
                        }
                    }
                });
            });
        }
    }

    // 渲染下一个方块
    function renderNextPiece() {
        // 清除之前的显示
        document.querySelectorAll('#next-piece .cell').forEach(cell => {
            cell.className = 'cell';
        });

        if (nextPieceShape) {
            // 计算居中显示的偏移量
            const offsetRow = Math.floor((NEXT_PIECE_SIZE - nextPieceShape.shape.length) / 2);
            const offsetCol = Math.floor((NEXT_PIECE_SIZE - nextPieceShape.shape[0].length) / 2);

            nextPieceShape.shape.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        const renderRow = offsetRow + rowIndex;
                        const renderCol = offsetCol + colIndex;
                        const index = renderRow * NEXT_PIECE_SIZE + renderCol;
                        const cellElement = nextPiece.children[index];
                        cellElement.classList.add(nextPieceShape.color);
                    }
                });
            });
        }
    }

    // 检查碰撞
    function checkCollision(piece, position) {
        return piece.shape.some((row, rowIndex) => {
            return row.some((cell, colIndex) => {
                if (cell) {
                    const newRow = position.row + rowIndex;
                    const newCol = position.col + colIndex;
                    return (
                        newRow >= ROWS ||
                        newCol < 0 ||
                        newCol >= COLS ||
                        (newRow >= 0 && boardGrid[newRow][newCol])
                    );
                }
                return false;
            });
        });
    }

    // 将当前方块固定到游戏板上
    function lockPiece() {
        currentPiece.shape.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    const newRow = currentPosition.row + rowIndex;
                    const newCol = currentPosition.col + colIndex;
                    if (newRow >= 0) {
                        boardGrid[newRow][newCol] = currentPiece.color;
                    }
                }
            });
        });

        // 检查游戏是否结束（方块超出顶部）
        if (currentPosition.row < 0) {
            endGame();
            return;
        }

        // 检查并消除完整行
        checkLines();

        // 生成新方块
        spawnPiece();
    }

    // 检查并消除完整行
    function checkLines() {
        let linesCleared = 0;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (boardGrid[row].every(cell => cell)) {
                // 移除完整行
                boardGrid.splice(row, 1);
                // 在顶部添加新的空行
                boardGrid.unshift(Array(COLS).fill(0));
                // 由于移除了一行，需要检查当前行（现在是新行）
                row++;
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            // 根据消除行数计算得分
            const lineScores = [0, 100, 300, 500, 800];
            score += lineScores[linesCleared] * Math.floor(lines / 10 + 1);
            lines += linesCleared;
            updateScore();
        }
    }

    // 更新分数显示
    function updateScore() {
        scoreElement.textContent = score;
        linesElement.textContent = lines;
    }

    // 生成新方块
    function spawnPiece() {
        currentPiece = nextPieceShape || createPiece();
        nextPieceShape = createPiece();

        // 设置初始位置（居中顶部）
        currentPosition = {
            row: 0,
            col: Math.floor((COLS - currentPiece.shape[0].length) / 2)
        };

        // 检查游戏是否已经结束（新方块无法放置）
        if (checkCollision(currentPiece, currentPosition)) {
            endGame();
        }

        renderNextPiece();
    }

    // 移动方块
    function movePiece(direction) {
        if (!currentPiece || isPaused) return;

        const newPosition = {
            row: currentPosition.row,
            col: currentPosition.col
        };

        switch (direction) {
            case 'left':
                newPosition.col--;
                break;
            case 'right':
                newPosition.col++;
                break;
            case 'down':
                newPosition.row++;
                break;
        }

        if (!checkCollision(currentPiece, newPosition)) {
            currentPosition = newPosition;
            renderBoard();
            return true;
        } else if (direction === 'down') {
            lockPiece();
            renderBoard();
            return false;
        }

        return false;
    }

    // 旋转方块
    function rotatePiece() {
        if (!currentPiece || isPaused) return;

        // 创建旋转后的新形状（转置矩阵并反转每一行）
        const rotatedShape = currentPiece.shape[0].map((_, colIndex) =>
            currentPiece.shape.map(row => row[colIndex]).reverse()
        );

        const originalShape = currentPiece.shape;
        currentPiece.shape = rotatedShape;

        // 如果旋转后发生碰撞，尝试墙踢（左右移动）
        if (checkCollision(currentPiece, currentPosition)) {
            // 尝试向右移动
            if (!checkCollision(currentPiece, { ...currentPosition, col: currentPosition.col + 1 })) {
                currentPosition.col++;
            } 
            // 尝试向左移动
            else if (!checkCollision(currentPiece, { ...currentPosition, col: currentPosition.col - 1 })) {
                currentPosition.col--;
            } 
            // 无法旋转，恢复原始形状
            else {
                currentPiece.shape = originalShape;
                return;
            }
        }

        renderBoard();
    }

    // 开始游戏
    function startGame() {
        // 重置游戏状态
        boardGrid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        score = 0;
        lines = 0;
        isPaused = false;
        updateScore();

        // 隐藏游戏结束界面
        gameOverElement.style.display = 'none';

        // 生成初始方块
        nextPieceShape = createPiece();
        spawnPiece();

        // 启动游戏循环
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(() => movePiece('down'), 1000);

        // 更新按钮状态
        startButton.disabled = true;
        pauseButton.disabled = false;

        renderBoard();
    }

    // 暂停游戏
    function pauseGame() {
        if (isPaused) {
            // 恢复游戏
            gameLoop = setInterval(() => movePiece('down'), 1000);
            pauseButton.textContent = '暂停';
            gameOverElement.style.display = 'none';
        } else {
            // 暂停游戏
            clearInterval(gameLoop);
            pauseButton.textContent = '继续';
            // 显示暂停信息
            gameOverElement.style.display = 'block';
            gameOverElement.querySelector('h2').textContent = '游戏暂停';
            gameOverElement.querySelector('p').style.display = 'none';
        }
        isPaused = !isPaused;
    }

    // 结束游戏
    function endGame() {
        clearInterval(gameLoop);
        gameOverElement.style.display = 'block';
        gameOverElement.querySelector('h2').textContent = '游戏结束!';
        gameOverElement.querySelector('p').style.display = 'block';
        finalScoreElement.textContent = score;
        finalLinesElement.textContent = lines;

        // 重置按钮状态
        startButton.disabled = false;
        pauseButton.disabled = true;
        pauseButton.textContent = '暂停';
    }

    // 处理键盘输入
    function handleKeyPress(e) {
        if (!currentPiece || isPaused) return;

        switch (e.key) {
            case 'ArrowLeft':
                movePiece('left');
                break;
            case 'ArrowRight':
                movePiece('right');
                break;
            case 'ArrowDown':
                movePiece('down');
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            case ' ': // 空格键快速下落
                while (movePiece('down')) {}
                break;
        }
    }

    // 初始化游戏
    initializeBoard();

    // 添加事件监听
document.addEventListener('keydown', handleKeyPress);
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', pauseGame);
});