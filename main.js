let selectedBoxIndex = null;
let selectionTime = 0;
let userSelectedAnswer = null;

async function main() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const model = await handpose.load();
    const questions = [
        ["What is the capital of France?", "Berlin", "Madrid", "Paris", "London", 3],
        ["What is the largest planet in our solar system?", "Earth", "Jupiter", "Saturn", "Mars", 2],
        ["What is the smallest country in the world?", "Monaco", "Tuvalu", "Nauru", "Vatican City", 4],
        ["What is the longest river in the world?", "Nile", "Amazon", "Yangtze", "Mississippi", 1],
        ["What is the hottest continent on Earth?", "Africa", "Asia", "Australia", "Antarctica", 1]
    ];
    let currentQuestion = 0;
    let answerBoxes = [
        { x: 25, y: 250, width: 280, height: 100 },
        { x: 335, y: 250, width: 280, height: 100 },
        { x: 25, y: 360, width: 280, height: 100 },
        { x: 335, y: 360, width: 280, height: 100 }
    ];

    function displayQuestion(questionIndex) {
        const questionData = questions[questionIndex];
        document.getElementById('question').textContent = questionData[0];
        document.getElementById('feedback').textContent = "";
        drawAnswerBoxes(questionData.slice(1, 5), []);
    }

    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
        });

    video.onloadedmetadata = () => {
        video.play();
        runDetection();
    };

    function runDetection() {
        model.estimateHands(video, true).then(predictions => {
            drawHand(predictions);
            requestAnimationFrame(runDetection);
        });
    }

    function drawHand(predictions) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (currentQuestion >= questions.length) {
            return;
        }

        const answers = questions[currentQuestion].slice(1, 5);
        const correctAnswerIndex = questions[currentQuestion][5];
        drawAnswerBoxes(answers, predictions);

        if (predictions.length > 0) {
            const landmarks = predictions[0].landmarks;
            const indexFingerTip = landmarks[8];
            const x = canvas.width - indexFingerTip[0];
            const y = indexFingerTip[1];
            let hoverBoxIndex = null;

            answers.forEach((answer, idx) => {
                const box = answerBoxes[idx];
                const boxX = canvas.width - (box.x + box.width);
                if (x > boxX && x < boxX + box.width && y > box.y && y < box.y + box.height) {
                    hoverBoxIndex = idx;
                    if (selectedBoxIndex !== hoverBoxIndex) {
                        selectedBoxIndex = hoverBoxIndex;
                        selectionTime = Date.now();
                    }
                }
            });

            if (hoverBoxIndex === null) {
                selectedBoxIndex = null;
            }

            if (selectedBoxIndex !== null && Date.now() - selectionTime > 3000) {
                if (userSelectedAnswer === null) {
                    userSelectedAnswer = selectedBoxIndex + 1;
                    displayAnswerFeedback(userSelectedAnswer === correctAnswerIndex);
                }
                const selectedBox = answerBoxes[selectedBoxIndex];
                const boxX = canvas.width - (selectedBox.x + selectedBox.width);
                context.strokeStyle = "gold";
                context.lineWidth = 5;
                context.strokeRect(boxX, selectedBox.y, selectedBox.width, selectedBox.height);
            }
        }
    }

    function drawAnswerBoxes(answers, predictions) {
        const fingerTip = predictions.length > 0 ? predictions[0].landmarks[8] : null;
        const xTip = fingerTip ? canvas.width - fingerTip[0] : null;
        const yTip = fingerTip ? fingerTip[1] : null;

        answers.forEach((answer, idx) => {
            const box = answerBoxes[idx];
            const boxX = canvas.width - (box.x + box.width);

            context.strokeStyle = (fingerTip && xTip > boxX && xTip < boxX + box.width && yTip > box.y && yTip < box.y + box.height) ? "red" : "blue";
            context.lineWidth = 3;
            context.strokeRect(boxX, box.y, box.width, box.height);

            context.save();
            context.scale(-1, 1);
            context.font = "20px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "white";
            context.fillText(answer, -(boxX + box.width / 2), box.y + box.height / 2);
            context.restore();
        });
    }

    function displayAnswerFeedback(isCorrect) {
        const correctAnswerIndex = questions[currentQuestion][5];
        const correctAnswer = questions[currentQuestion][correctAnswerIndex];
        const feedbackText = isCorrect ? "You answered correctly!" : `Your answer is wrong. The correct answer is: ${correctAnswer}`;
        document.getElementById('feedback').textContent = feedbackText;
        if (isCorrect) {
            setTimeout(() => {
                if (currentQuestion + 1 < questions.length) {
                    currentQuestion++;
                    selectedBoxIndex = null;
                    userSelectedAnswer = null;
                    displayQuestion(currentQuestion);
                } else {
                    currentQuestion++;
                    document.getElementById('feedback').textContent = "Congratulations on completing all questions!";
                    document.getElementById('question').textContent = "";
                }
            }, 2000);
        } else {
            userSelectedAnswer = null;
        }
    }

    displayQuestion(currentQuestion);
}

main();