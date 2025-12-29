let roomBg;
let spriteSheet;
let spriteSheetWidth = 479;  // 整個精靈表總寬度
let spriteSheetHeight = 66;  // 整個精靈表高度
let spriteFrames = 11;       // 總幀數
let frameWidth;              // 單幀寬度（計算出來）
let frameHeight = 66;        // 單幀高度
let currentFrame = 0;
let frameSpeed = 0.1;
let personX;                 // 人物X位置
let personY;                 // 人物Y位置
let speed = 5;               // 移動速度
let keys = {};               // 按鍵狀態

// 恐龍相關
let dinoSheet;
// 每格寬高為 148x42，總共 3 張圖
let dinoSheetWidth = 148 * 3;    // 恐龍精靈表總寬度（3 張 * 148）
let dinoSheetHeight = 42;        // 恐龍精靈表高度
let dinoFrames = 3;              // 恐龍總幀數
let dinoFrameWidth;          // 恐龍單幀寬度
let dinoFrameHeight = 42;    // 恐龍單幀高度
let dinoFramesImgs = [];     // 若有拆成多張檔案（0.png,1.png,2.png）則存放在此
let dinoX;                   // 恐龍X位置
let dinoY;                   // 恐龍Y位置
let dinoFrame = 0;
let dinoSpeed = 2;           // 恐龍移動速度
let collisionDetected = false;
let dinoStopped = false;     // 碰撞時暫停移動
// 碰撞旗標（供 draw() 決定 NPC 是否暫停移動）
let collisionWithDinoFlag = false;
let collisionWithPigFlag = false;
let collisionWithCatFlag = false;
// 遊戲階段：0=主畫面，1=第二畫面（逃脫成功）
let gameStage = 0;
let room4Bg;
// 背景音樂
let audio1; // 第一幕 HTML5 Audio 元素
let audio2; // 第二幕 HTML5 Audio 元素
let currentAudio = null; // 當前播放的音樂
let lastGameStage = -1; // 追蹤上一個 gameStage 以偵測切換

// 題庫與階段控制
let dinoQuestions = [
  { question: '請問提出近測發展區的人是誰?', answer: '維高斯基' },
  { question: '階層需求理論是誰提出來的?', answer: '馬斯洛' }
];
let pigQuestions = [
  { question: '0-2歲是皮亞傑提出的什麼期?', answer: '感覺動作期' },
  { question: '2-7歲是皮亞傑提出的什麼期?', answer: '前運思期' }
];
let catQuestions = [
  { question: '7-11歲是皮亞傑提出的什麼期?', answer: '具體運思期' },
  { question: '11歲以上是皮亞傑提出的什麼期?', answer: '形式運思期' }
];
let activeQuestions = dinoQuestions; // 目前作用題庫
let currentQuestion = 0;
let questionStage = 0; // 0: dino, 1: pig, 2: done
let dinoActive = true;

// 豬相關
let pigSheet;
let pigSheetWidth = 553;
let pigSheetHeight = 31;
let pigFrames = 9;
let pigFrameWidth;
let pigFrameHeight = 31;
let pigX;
let pigY;
let pigFrame = 0;
let pigSpeed = 2;
let pigActive = false;
let pigTriggered = false; // 是否已被碰撞觸發（保持題目顯示直到 pig 消失）
let pigStopped = false;     // 碰撞時暫停移動

// 貓相關
let catSheet;
let catSheetWidth = 526;
let catSheetHeight = 95;
let catFrames = 9;
let catFrameWidth;
let catFrameHeight = 95;
let catX;
let catY;
let catFrame = 0;
let catActive = false;
let catTriggered = false; // 是否已被碰撞觸發（保持題目顯示直到 cat 消失）
let catStopped = false;     // 碰撞時暫停移動

// 對話系統
let playerInput = '';
let showDialog = false;
let feedback = '';
let feedbackTimer = 0;
let inputElem = null; // 原生輸入元素（支援中文輸入）
let isComposing = false; // IME 組字狀態

function preload() {
  roomBg = loadImage('Room 1.png');
  spriteSheet = loadImage('人/人all.png');
  dinoSheet = loadImage('恐龍問問題/恐龍問題all.png');
  // 嘗試載入分割成多張的幀（0.png,1.png,2.png），若存在則使用
  for (let i = 0; i < 3; i++) {
    // 為了保持 preload 同步，直接指定陣列位置
    dinoFramesImgs[i] = loadImage('恐龍問問題/' + i + '.png',
      () => {},
      () => { dinoFramesImgs[i] = null; }
    );
  }
  pigSheet = loadImage('豬問問題/豬問題all.png');
  catSheet = loadImage('貓咪答對/貓答對all.png');
  room4Bg = loadImage('Room 4.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameWidth = spriteSheetWidth / spriteFrames;  // 計算單幀寬度
  personX = width / 2;  // 初始X位置（中心）
  personY = height / 2; // 初始Y位置（中心）
  
  // 使用 HTML5 Audio 元素（更穩定）
  audio1 = new Audio('第一幕.wav');
  audio2 = new Audio('第二幕.wav');
  
  // 設定循環播放與音量
  audio1.loop = true;
  audio2.loop = true;
  audio1.volume = 0.3;
  audio2.volume = 0.3;
  
  // 在使用者首次互動後播放音樂
  let startMusic = () => {
    if (currentAudio === null) {
      currentAudio = audio1;
      audio1.play().catch(() => console.log('音樂播放失敗，可能需要使用者互動'));
    }
    // 移除事件監聽器（只需要觸發一次）
    document.removeEventListener('click', startMusic);
    document.removeEventListener('keydown', startMusic);
  };
  
  // 監聽使用者互動以解鎖音頻
  document.addEventListener('click', startMusic);
  document.addEventListener('keydown', startMusic);
  
  lastGameStage = 0;
  
  // 恐龍初始化
  // 若有分割成多張檔案，使用那些檔案的寬高來設定幀數與尺寸
  let numFramesFromFiles = 0;
  for (let i = 0; i < dinoFramesImgs.length; i++) {
    if (dinoFramesImgs[i] && dinoFramesImgs[i].width) numFramesFromFiles++;
  }
  if (numFramesFromFiles > 0) {
    dinoFrames = numFramesFromFiles;
    dinoFrameWidth = dinoFramesImgs[0].width;
    dinoFrameHeight = dinoFramesImgs[0].height;
    dinoSheetWidth = dinoFrameWidth * dinoFrames;
    dinoSheetHeight = dinoFrameHeight;
  } else {
    dinoFrameWidth = dinoSheetWidth / dinoFrames;  // 計算恐龍單幀寬度
  }
  dinoX = width * 0.75;  // 恐龍初始位置（右側）
  dinoY = height / 2;
  // 豬初始化（先隱藏）
  pigFrameWidth = pigSheetWidth / pigFrames;
  pigX = width * 0.75;
  pigY = height * 0.85; // 背景下方
  pigActive = false;
  // 貓初始化（先隱藏）
  catFrameWidth = catSheetWidth / catFrames;
  catX = width - catFrameWidth / 2 - 20;
  catY = catFrameHeight / 2 + 20;
  catActive = false;
}

function draw() {
  // 根據 gameStage 切換背景音樂
  if (gameStage !== lastGameStage) {
    lastGameStage = gameStage;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (gameStage === 0) {
      currentAudio = audio1;
      audio1.currentTime = 0;
      audio1.play().catch(() => console.log('第一幕播放失敗'));
    } else if (gameStage === 1) {
      currentAudio = audio2;
      audio2.currentTime = 0;
      audio2.play().catch(() => console.log('第二幕播放失敗'));
    }
  }
  
  if (gameStage === 1) {
    // 第二畫面：Room4 背景 + 可移動的人 + 文字
    image(room4Bg, 0, 0, width, height);
    // 處理按鍵移動
    if (keys['ArrowUp'] || keys['w'] || keys['W']) personY -= speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) personY += speed;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) personX -= speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) personX += speed;
    personX = constrain(personX, frameWidth / 2, width - frameWidth / 2);
    personY = constrain(personY, frameHeight / 2, height - frameHeight / 2);
    // draw person
    let personDrawX = personX - frameWidth / 2;
    let personDrawY = personY - frameHeight / 2;
    let frameX = floor(currentFrame) * frameWidth;
    copy(spriteSheet, frameX, 0, frameWidth, frameHeight, personDrawX, personDrawY, frameWidth, frameHeight);
    currentFrame += frameSpeed;
    if (currentFrame >= spriteFrames) currentFrame = 0;
    // 顯示紅色發光與呼吸特效文字
    push();
    translate(width / 2, 40);
    let pulse = 1 + 0.06 * sin(frameCount * 0.12);
    let baseSize = 48;
    textAlign(CENTER, TOP);
    textSize(baseSize * pulse);
    // 使用 canvas 的 shadow 來做發光
    drawingContext.shadowBlur = 30 + 10 * sin(frameCount * 0.12);
    drawingContext.shadowColor = 'rgba(255,0,0,0.9)';
    noStroke();
    fill(220, 20, 20);
    text('恭喜你逃脫成功', 0, 0);
    // 加一層淡淡外框讓字更顯眼
    drawingContext.shadowBlur = 0;
    stroke(255, 120, 120, 180);
    strokeWeight(2);
    noFill();
    text('恭喜你逃脫成功', 0, 0);
    pop();
    return;
  }
  // 繪製背景
  image(roomBg, 0, 0, width, height);
  
  // 處理按鍵移動
  if (keys['ArrowUp'] || keys['w'] || keys['W']) {
    personY -= speed;
  }
  if (keys['ArrowDown'] || keys['s'] || keys['S']) {
    personY += speed;
  }
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
    personX -= speed;
  }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) {
    personX += speed;
  }
  
  // 邊界檢查
  personX = constrain(personX, frameWidth / 2, width - frameWidth / 2);
  personY = constrain(personY, frameHeight / 2, height - frameHeight / 2);
  
  // 計算人物精靈位置
  let personDrawX = personX - frameWidth / 2;
  let personDrawY = personY - frameHeight / 2;
  
  // 計算人物當前幀在精靈表中的位置
  let frameX = floor(currentFrame) * frameWidth;
  
  // 繪製人物精靈
  copy(spriteSheet, frameX, 0, frameWidth, frameHeight, personDrawX, personDrawY, frameWidth, frameHeight);
  
  // 更新人物幀
  currentFrame += frameSpeed;
  if (currentFrame >= spriteFrames) {
    currentFrame = 0;
  }
  
  // 恐龍移動與繪製（若存在）
  if (dinoActive) {
    // 若與玩家正在碰撞，暫停移動以讓對話框固定
    if (!collisionWithDinoFlag) {
      dinoX -= dinoSpeed;
      if (dinoX < -dinoFrameWidth) {
        dinoX = width + dinoFrameWidth;  // 循環回到右邊
      }
    }
    // 計算恐龍精靈位置
    let dinoDrawX = dinoX - dinoFrameWidth / 2;
    let dinoDrawY = dinoY - dinoFrameHeight / 2;
    let fIndex = floor(dinoFrame) % dinoFrames;
    // 若有分割成多張檔案，優先使用個別幀圖，否則使用 sprite sheet 切片
    if (dinoFramesImgs && dinoFramesImgs[fIndex]) {
      image(dinoFramesImgs[fIndex], dinoDrawX, dinoDrawY, dinoFrameWidth, dinoFrameHeight);
    } else {
      let dinoFrameX = fIndex * dinoFrameWidth;
      copy(dinoSheet, dinoFrameX, 0, dinoFrameWidth, dinoFrameHeight, dinoDrawX, dinoDrawY, dinoFrameWidth, dinoFrameHeight);
    }
    dinoFrame += frameSpeed;
    if (dinoFrame >= dinoFrames) dinoFrame = 0;
  }
  // 豬移動與繪製（若存在）
  if (pigActive) {
    // 若與玩家正在碰撞，暫停移動
    if (!collisionWithPigFlag) {
      pigX -= pigSpeed;
      if (pigX < -pigFrameWidth) pigX = width + pigFrameWidth;
    }
    let pigDrawX = pigX - pigFrameWidth / 2;
    let pigDrawY = pigY - pigFrameHeight / 2;
    let pigFrameX = floor(pigFrame) * pigFrameWidth;
    copy(pigSheet, pigFrameX, 0, pigFrameWidth, pigFrameHeight, pigDrawX, pigDrawY, pigFrameWidth, pigFrameHeight);
    pigFrame += frameSpeed;
    if (pigFrame >= pigFrames) pigFrame = 0;
  }
  // 貓繪製（若存在） - 固定角落，不移動
  if (catActive) {
    let catDrawX = catX - catFrameWidth / 2;
    let catDrawY = catY - catFrameHeight / 2;
    let catFrameX = floor(catFrame) * catFrameWidth;
    copy(catSheet, catFrameX, 0, catFrameWidth, catFrameHeight, catDrawX, catDrawY, catFrameWidth, catFrameHeight);
    catFrame += frameSpeed;
    if (catFrame >= catFrames) catFrame = 0;
  }
  
  // 碰撞偵測
  checkCollision();
  
  // 顯示對話系統
  if (showDialog) {
    drawDialogSystem();
    feedbackTimer--;
  }
  else {
    // 如果對話關閉，移除輸入欄
    if (inputElem) {
      inputElem.remove();
      inputElem = null;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  // 更新按鍵狀態（即使對話框開啟也更新，輸入框會攔截事件）
  keys[key] = true;
  if (showDialog) {
    if (key === 'Enter') {
      // 若使用原生輸入框處理輸入，避免 p5 多次送出
      if (!inputElem && !isComposing) {
        submitAnswer();
      }
    } else if (key === 'Escape') {
      // 取消對話
      showDialog = false;
      playerInput = '';
      feedback = '';
      feedbackTimer = 0;
    }
    return false;
  } else {
    if (keyCode === LEFT || keyCode === RIGHT || keyCode === UP || keyCode === DOWN) {
      return false; // 防止頁面滾動
    }
  }
}

function keyReleased() {
  keys[key] = false;
}

// 碰撞偵測函數
function checkCollision() {
  // 計算人物邊界
  let personLeft = personX - frameWidth / 2;
  let personRight = personX + frameWidth / 2;
  let personTop = personY - frameHeight / 2;
  let personBottom = personY + frameHeight / 2;
  
  // 計算恐龍邊界
  let dinoLeft = dinoX - dinoFrameWidth / 2;
  let dinoRight = dinoX + dinoFrameWidth / 2;
  let dinoTop = dinoY - dinoFrameHeight / 2;
  let dinoBottom = dinoY + dinoFrameHeight / 2;
  
  // AABB碰撞偵測
  collisionDetected = false;
  let collisionWithDino = false;
  if (dinoActive) {
    if (personLeft < dinoRight &&
        personRight > dinoLeft &&
        personTop < dinoBottom &&
        personBottom > dinoTop) {
      collisionWithDino = true;
    }
  }

  let collisionWithPig = false;
  if (pigActive) {
    let pigLeft = pigX - pigFrameWidth / 2;
    let pigRight = pigX + pigFrameWidth / 2;
    let pigTop = pigY - pigFrameHeight / 2;
    let pigBottom = pigY + pigFrameHeight / 2;
    if (personLeft < pigRight &&
        personRight > pigLeft &&
        personTop < pigBottom &&
        personBottom > pigTop) {
      collisionWithPig = true;
    }
  }

  let collisionWithCat = false;
  if (catActive) {
    let catLeft = catX - catFrameWidth / 2;
    let catRight = catX + catFrameWidth / 2;
    let catTop = catY - catFrameHeight / 2;
    let catBottom = catY + catFrameHeight / 2;
    if (personLeft < catRight &&
        personRight > catLeft &&
        personTop < catBottom &&
        personBottom > catTop) {
      collisionWithCat = true;
    }
  }

  // 根據各 NPC 的碰撞結果決定是否顯示對話，以及哪個題庫要被啟動
  collisionDetected = collisionWithDino || collisionWithPig || collisionWithCat;
  if (collisionWithDino) {
    if (!showDialog) {
      showDialog = true;
      currentQuestion = 0;
      // 立即建立輸入欄，讓問題與回答區同時出現
      let personBoxX = personX;
      let personBoxY = personY + frameHeight / 2 + 80;
      ensureInputElement(personBoxX, personBoxY, 300);
    }
    activeQuestions = dinoQuestions;
    questionStage = 0;
    console.log('Collision with dino. currentQuestion=', currentQuestion);
  }
  // Pig: 只有在首次碰撞時觸發題目，觸發後保持顯示直到 pigActive 變 false
  if (collisionWithPig && pigActive && !pigTriggered) {
    pigTriggered = true;
    showDialog = true;
    currentQuestion = 0;
    activeQuestions = pigQuestions;
    questionStage = 1;
    let personBoxX = personX;
    let personBoxY = personY + frameHeight / 2 + 80;
    ensureInputElement(personBoxX, personBoxY, 300);
    console.log('Pig triggered by collision.');
  }
  // Cat: 只有在首次碰撞時觸發題目，觸發後保持顯示直到 catActive 變 false
  if (collisionWithCat && catActive && !catTriggered) {
    catTriggered = true;
    showDialog = true;
    currentQuestion = 0;
    activeQuestions = catQuestions;
    questionStage = 2;
    let personBoxX = personX;
    let personBoxY = personY + frameHeight / 2 + 80;
    ensureInputElement(personBoxX, personBoxY, 300);
    console.log('Cat triggered by collision.');
  }

  // 更新全域碰撞旗標供 draw() 使用（讓 NPC/對話在碰撞時停止移動）
  collisionWithDinoFlag = collisionWithDino;
  collisionWithPigFlag = collisionWithPig;
  collisionWithCatFlag = collisionWithCat;
}

// 繪製對話系統
function drawDialogSystem() {
  // 恐龍的對話框（問題）
  let dinoBoxX = dinoX;
  let dinoBoxY = dinoY - dinoFrameHeight / 2 - 80;
  let boxWidth = 300;
  let boxHeight = 70;
  
  // 恐龍問題框
  fill(255);  // 白色背景
  stroke(0);  // 黑色邊框
  strokeWeight(1);
  // 決定要顯示哪個 NPC 的問題框（恐龍、豬 或 貓）
  let npcX = dinoBoxX;
  let npcY = dinoBoxY;
  if (questionStage === 1 && pigActive) {
    npcX = pigX;
    npcY = pigY - pigFrameHeight / 2 - 80;
  } else if (questionStage === 2 && catActive) {
    // 顯示在貓旁（下方），但保證框不會超出畫面
    npcX = catX;
    npcY = catY + catFrameHeight / 2 + 20;
  }
  // 計算框位置並裁切於畫面內
  let boxLeft = npcX - boxWidth / 2;
  let boxTop = npcY - boxHeight / 2;
  if (boxLeft < 10) boxLeft = 10;
  if (boxLeft + boxWidth > width - 10) boxLeft = width - 10 - boxWidth;
  if (boxTop < 10) boxTop = 10;
  if (boxTop + boxHeight > height - 10) boxTop = height - 10 - boxHeight;
  fill(255);  // 白色背景
  stroke(0);
  strokeWeight(1);
  rect(boxLeft, boxTop, boxWidth, boxHeight, 10);
  noStroke();
  fill(0);    // 黑色文字
  textSize(12);
  textFont('Arial');
  textAlign(LEFT, TOP);
  // 使用 text 的寬度參數來自動換行
  let qText = activeQuestions[currentQuestion].question;
  text(qText, boxLeft + 10, boxTop + 10, boxWidth - 20, boxHeight - 20);
  
  // 人物的回答框
  let personBoxX = personX;
  let personBoxY = personY + frameHeight / 2 + 80;
  
  // 人物回答框
  // 移除畫布上的人物輸入長方形；改用原生輸入框顯示（支援中文輸入）
  // 顯示玩家輸入位置由原生輸入欄處理
  
  // 顯示提示
  fill(100);
  textSize(10);
  textFont('Arial');
  text('按Enter提交答案，Esc取消', personBoxX, personBoxY + 20);
  
  // 顯示反饋
  if (feedbackTimer > 0) {
    fill(feedbackTimer > 30 ? color(0, 200, 0) : color(255, 0, 0));
    textSize(20);
    textFont('Arial');
    textAlign(CENTER);
    text(feedback, width / 2, 50);
  }

  // 建立或更新輸入框（支援中文輸入）
  ensureInputElement(personBoxX, personBoxY, boxWidth);
}

// 提交答案的共用函式（也會被輸入欄的 Enter 事件呼叫）
function submitAnswer() {
  let val = '';
  if (inputElem) {
    val = inputElem.value().trim();
  } else {
    val = playerInput.trim();
  }
  // 正規化輸入與答案（去空白與常見標點）再比對，避免多餘空白或標點造成錯誤
  function normalize(s) {
    return s
      .normalize('NFC')
      .replace(/[\u200B-\u200F\uFEFF]/g, '')
      .replace(/\s+/g, '')
      .replace(/[.,!?，。！？:：;；\-—()（）\[\]"'“”《》<>]+/g, '')
      .toLowerCase();
  }
  console.log('submitAnswer called; currentQuestion=', currentQuestion, 'activeLen=', activeQuestions.length, 'val=[', val, ']');
  let normVal = normalize(val);
  let normAns = normalize(activeQuestions[currentQuestion].answer);
  console.log('normalized:', normVal, normAns);
  // 更寬鬆的比對：相等或互為子字串，避免隱藏字元或輸入方式造成誤判
  if (normVal === normAns || normVal.includes(normAns) || normAns.includes(normVal)) {
    // 不同題目顯示不同正確訊息
    // 不同題目顯示不同正確訊息（依目前 activeQuestions 與 stage）
    if (questionStage === 0) {
      // 恐龍階段：兩題分別顯示特定訊息
      if (currentQuestion === 0) feedback = '回答正確，你好棒';
      else if (currentQuestion === 1) feedback = '回答正確，excellent';
      else feedback = '回答正確！';
    } else if (questionStage === 1) {
      // 豬階段：通用正確訊息
      feedback = '太棒了，回答正確';
    } else {
      feedback = '回答正確！';
    }
    // 顯示 3 秒（約 180 幀）
    feedbackTimer = 180;
    if (inputElem) inputElem.value('');
    // 決定是否需要立即從恐龍階段切換到豬階段（當前為恐龍第2題）
    let stageSwitchDino = (questionStage === 0 && currentQuestion === 1);
    console.log('stageSwitchDino=', stageSwitchDino, 'questionStage=', questionStage, 'currentQuestion=', currentQuestion);
    if (stageSwitchDino) {
      // 立即切換 NPC：恐龍消失，豬出現
      dinoActive = false;
      pigActive = true;
      activeQuestions = pigQuestions;
      questionStage = 1;
      currentQuestion = 0;
      // 讓豬立刻出現在右側
      pigX = width + pigFrameWidth;
      // 清除 dino 觸發旗標（若有）
      // (dino 的 dialog 會在 dinoActive 變 false 後消失；pig 會等碰撞觸發)
      // 不自動觸發 pig 的題目 -- 等待玩家碰撞 pig
      // 如果 dino 被關閉，若無其他 triggered，則關閉 dialog
      if (!pigTriggered && !catTriggered) {
        showDialog = false;
        if (inputElem) { inputElem.remove(); inputElem = null; }
      }
    }
    // 決定是否需要立即從豬階段切換到貓階段（當前為豬第2題）
    let stageSwitchPig = (questionStage === 1 && currentQuestion === 1);
    if (stageSwitchPig) {
      pigActive = false;
      catActive = true;
      activeQuestions = catQuestions;
      questionStage = 2;
      currentQuestion = 0;
      // 讓貓立即出現在角落
      catX = width - catFrameWidth / 2 - 20;
      catY = catFrameHeight / 2 + 20;
      // pig 消失後，清除 pigTriggered 並移除其 dialog（除非 cat 已被觸發）
      pigTriggered = false;
      if (!catTriggered) {
        showDialog = false;
        if (inputElem) { inputElem.remove(); inputElem = null; }
      }
    }
    // 在 3 秒後（維持回饋顯示）處理下一步：若非階段切換則前往下一題，若已切換則只聚焦輸入框
    setTimeout(() => {
      if (!(stageSwitchDino || stageSwitchPig)) {
        nextQuestion();
      }
      if (inputElem) {
        inputElem.value('');
        inputElem.elt.focus();
      }
    }, 3000);
  } else {
    // 錯誤時顯示指定格式（顯示該題正確答案）
    if (questionStage === 1) {
      feedback = '答錯了是' + activeQuestions[currentQuestion].answer;
    } else {
      feedback = '回答錯誤，' + activeQuestions[currentQuestion].answer;
    }
    feedbackTimer = 180;
    if (inputElem) {
      inputElem.value('');
      inputElem.elt.focus();
    }
  }
}

// 在 drawDialogSystem 中動態建立並定位原生輸入欄（支援中文 IME）
function ensureInputElement(personBoxX, personBoxY, boxWidth) {
  let inpX = personBoxX - boxWidth / 2 + 20;
  let inpY = personBoxY - 10 + (window.scrollY || 0);
  if (!inputElem) {
    inputElem = createInput('');
    inputElem.size(boxWidth - 40, 26);
    inputElem.position(inpX, inpY);
    inputElem.elt.style.fontSize = '14px';
    inputElem.attribute('autocomplete', 'off');
    inputElem.elt.style.zIndex = 1000;
    inputElem.elt.focus();
    // 當輸入時同步到 playerInput（可選）
    inputElem.input(() => {
      playerInput = inputElem.value();
    });
    // 支援 Enter 與 Esc 快捷鍵
    inputElem.elt.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        // 若正在使用 IME 組字，不送出
        if (isComposing) return;
        e.preventDefault();
        e.stopPropagation();
        submitAnswer();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        showDialog = false;
        if (inputElem) { inputElem.remove(); inputElem = null; }
      }
    });
    // IME 組字事件處理
    inputElem.elt.addEventListener('compositionstart', () => { isComposing = true; });
    inputElem.elt.addEventListener('compositionend', () => { isComposing = false; });
  } else {
    inputElem.position(inpX, inpY);
  }
}

// 切換到下一題
function nextQuestion() {
  currentQuestion++;
  console.log('nextQuestion -> currentQuestion=', currentQuestion, 'activeLen=', activeQuestions.length, 'questionStage=', questionStage);
  // 如果超過目前題庫長度，處理階段切換
    if (currentQuestion >= activeQuestions.length) {
    if (questionStage === 0) {
      // 恐龍階段結束，移除恐龍，啟動豬
      dinoActive = false;
      pigActive = true;
      activeQuestions = pigQuestions;
      questionStage = 1;
      currentQuestion = 0;
      // 只有當沒有其他 NPC 已被觸發時才關閉對話
      if (!pigTriggered && !catTriggered) {
        showDialog = false;
        if (inputElem) { inputElem.remove(); inputElem = null; }
      }
      // 讓豬出現在畫面右側
      pigX = width + pigFrameWidth;
    } else if (questionStage === 1) {
      // 豬階段結束，移除豬，啟動貓
      pigActive = false;
      // 清除 pig 的觸發旗標
      pigTriggered = false;
      catActive = true;
      activeQuestions = catQuestions;
      questionStage = 2;
      currentQuestion = 0;
      // 只有當 cat 尚未被觸發時才關閉對話
      if (!catTriggered) {
        showDialog = false;
        if (inputElem) { inputElem.remove(); inputElem = null; }
      }
      // 放置貓於角落
      catX = width - catFrameWidth / 2 - 20;
      catY = catFrameHeight / 2 + 20;
    } else if (questionStage === 2) {
      // 貓階段結束，移除貓，結束流程
      catActive = false;
      // 清除 cat 的觸發旗標
      catTriggered = false;
      questionStage = 3;
      activeQuestions = [];
      currentQuestion = 0;
      // 沒有任何 NPC 可顯示，關閉對話
      showDialog = false;
      if (inputElem) { inputElem.remove(); inputElem = null; }
      // 切換到第二畫面（逃脫成功）
      gameStage = 1;
      // 將人物放在第二畫面中間
      personX = width / 2;
      personY = height / 2;
    }
  }
  playerInput = '';
  feedback = '';
  feedbackTimer = 0;
}
