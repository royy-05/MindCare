 let currentQuestion = 1;
    let totalQuestions = 9;
    let selectedAnswers = {};
    let currentAssessment = 'phq9'; // Start with PHQ-9
    let assessmentStarted = true;

    // PHQ-9 Depression Questions
    const phq9Questions = [
      "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
      "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
      "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
      "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
      "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
      "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself or that you are a failure or have let yourself or your family down?",
      "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?",
      "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual?",
      "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead, or of hurting yourself?"
    ];

    // GAD-7 Anxiety Questions  
    const gad7Questions = [
      "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
      "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
      "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?",
      "Over the last 2 weeks, how often have you been bothered by trouble relaxing?",
      "Over the last 2 weeks, how often have you been bothered by being so restless that it is hard to sit still?",
      "Over the last 2 weeks, how often have you been bothered by becoming easily annoyed or irritable?",
      "Over the last 2 weeks, how often have you been bothered by feeling afraid, as if something awful might happen?"
    ];

    const ratingLabels = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

    function selectRating(element, value) {
      // Clear previous selections
      document.querySelectorAll('.rating-circle').forEach(circle => {
        circle.classList.remove('selected');
      });
      
      // Select current option
      element.querySelector('.rating-circle').classList.add('selected');
      
      // Store the answer
      selectedAnswers[currentQuestion] = value;
      
      // Enable next button
      document.getElementById('nextBtn').disabled = false;
    }

    function updateQuestion() {
      const questionNumberEl = document.getElementById('questionNumber');
      const progressTextEl = document.getElementById('progressText');
      const progressBarEl = document.getElementById('progressBar');
      const progressLabelEl = document.getElementById('progressLabel');
      const backBtnEl = document.getElementById('backBtn');
      const nextBtnEl = document.getElementById('nextBtn');
      
      // Get current questions array
      const questions = currentAssessment === 'phq9' ? phq9Questions : gad7Questions;
      totalQuestions = questions.length;
      
      // Update question text
      questionNumberEl.textContent = `${currentQuestion}. ${questions[currentQuestion - 1]}`;
      
      // Update progress
      progressTextEl.textContent = `${currentQuestion}/${totalQuestions}`;
      progressBarEl.style.width = `${(currentQuestion / totalQuestions) * 100}%`;
      
      // Update progress label
      progressLabelEl.textContent = currentAssessment === 'phq9' ? 
        'Depression Screening (PHQ-9)' : 'Anxiety Screening (GAD-7)';
      
      // Update button states
      backBtnEl.disabled = currentQuestion === 1;
      nextBtnEl.disabled = !selectedAnswers[currentQuestion];
      
      // Update next button text
      if (currentQuestion === totalQuestions) {
        nextBtnEl.textContent = "Complete Assessment";
      } else {
        nextBtnEl.textContent = "Next Question";
      }
      
      // Clear current selection display
      document.querySelectorAll('.rating-circle').forEach(circle => {
        circle.classList.remove('selected');
      });
      
      // Show previous selection if exists
      if (selectedAnswers[currentQuestion] !== undefined) {
        const ratingOptions = document.querySelectorAll('.rating-option');
        const selectedValue = selectedAnswers[currentQuestion];
        ratingOptions[selectedValue].querySelector('.rating-circle').classList.add('selected');
        document.getElementById('nextBtn').disabled = false;
      }
    }

    function nextQuestion() {
      if (currentQuestion < totalQuestions) {
        currentQuestion++;
        updateQuestion();
      } else {
        // Complete assessment
        completeAssessment();
      }
    }

    function previousQuestion() {
      if (currentQuestion > 1) {
        currentQuestion--;
        updateQuestion();
      }
    }

    function calculateScore() {
      let totalScore = 0;
      for (let i = 1; i <= totalQuestions; i++) {
        totalScore += selectedAnswers[i] || 0;
      }
      return totalScore;
    }

    function getScoreInterpretation(score, assessmentType) {
      if (assessmentType === 'phq9') {
        if (score <= 4) return { level: 'Minimal', color: '#27ae60', message: 'Your responses suggest minimal depression symptoms.' };
        if (score <= 9) return { level: 'Mild', color: '#f39c12', message: 'Your responses suggest mild depression symptoms.' };
        if (score <= 14) return { level: 'Moderate', color: '#e67e22', message: 'Your responses suggest moderate depression symptoms.' };
        if (score <= 19) return { level: 'Moderately Severe', color: '#d35400', message: 'Your responses suggest moderately severe depression symptoms.' };
        return { level: 'Severe', color: '#c0392b', message: 'Your responses suggest severe depression symptoms.' };
      } else {
        if (score <= 4) return { level: 'Minimal', color: '#27ae60', message: 'Your responses suggest minimal anxiety symptoms.' };
        if (score <= 9) return { level: 'Mild', color: '#f39c12', message: 'Your responses suggest mild anxiety symptoms.' };
        if (score <= 14) return { level: 'Moderate', color: '#e67e22', message: 'Your responses suggest moderate anxiety symptoms.' };
        return { level: 'Severe', color: '#c0392b', message: 'Your responses suggest severe anxiety symptoms.' };
      }
    }

    function getRecommendations(score, assessmentType) {
      const recommendations = [];
      
      if (assessmentType === 'phq9') {
        if (score <= 4) {
          recommendations.push('Continue maintaining your current mental wellness practices');
          recommendations.push('Consider regular exercise and mindfulness activities');
        } else if (score <= 9) {
          recommendations.push('Try stress reduction techniques and relaxation exercises');
          recommendations.push('Consider speaking with a counselor if symptoms persist');
          recommendations.push('Maintain regular sleep and exercise routines');
        } else if (score <= 14) {
          recommendations.push('We recommend speaking with a mental health professional');
          recommendations.push('Consider counseling or therapy services available at your institution');
          recommendations.push('Reach out to friends, family, or support groups');
        } else {
          recommendations.push('We strongly recommend immediate consultation with a mental health professional');
          recommendations.push('Contact your college counseling center or healthcare provider');
          recommendations.push('Consider crisis support resources if you have thoughts of self-harm');
          if (score >= 15 && selectedAnswers[9] > 0) {
            recommendations.push('⚠️ If you are having thoughts of self-harm, please contact emergency services or a crisis hotline immediately');
          }
        }
      } else {
        if (score <= 4) {
          recommendations.push('Continue your current stress management practices');
          recommendations.push('Regular relaxation and mindfulness can help maintain low anxiety levels');
        } else if (score <= 9) {
          recommendations.push('Try deep breathing exercises and progressive muscle relaxation');
          recommendations.push('Consider reducing caffeine intake and maintaining regular sleep');
        } else {
          recommendations.push('We recommend speaking with a mental health professional about anxiety management');
          recommendations.push('Consider therapy techniques like Cognitive Behavioral Therapy (CBT)');
          recommendations.push('Practice anxiety reduction techniques and seek support from your network');
        }
      }
      
      return recommendations;
    }

    async function completeAssessment() {
  const score = calculateScore();
  const interpretation = getScoreInterpretation(score, currentAssessment);
  const recommendations = getRecommendations(score, currentAssessment);
  
  // Send results to backend
  try {
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? (window.location.port === '5000' ? '' : 'http://localhost:5000') : '';
    const response = await fetch(`${API_BASE_URL}/api/assessment/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assessmentType: currentAssessment,
        answers: selectedAnswers,
        score: score,
        interpretation: interpretation.level
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Assessment results saved:', result.data.sessionId);
    }
  } catch (error) {
    console.error('Error saving assessment:', error);
  }

  // Display results
  showResults(score, interpretation, recommendations);
}

    function showResults(score, interpretation, recommendations) {
      const modal = document.getElementById('resultsModal');
      const title = document.getElementById('resultsTitle');
      const content = document.getElementById('resultsContent');
      
      const assessmentName = currentAssessment === 'phq9' ? 'Depression Screening (PHQ-9)' : 'Anxiety Screening (GAD-7)';
      
      title.textContent = `${assessmentName} Results`;
      
      content.innerHTML = `
        <div class="result-score" style="color: ${interpretation.color};">
          <h3>Your Score: ${score}/${currentAssessment === 'phq9' ? '27' : '21'}</h3>
          <p class="score-level">${interpretation.level}</p>
        </div>
        
        <div class="result-message">
          <p>${interpretation.message}</p>
        </div>
        
        <div class="recommendations">
          <h4>Recommendations:</h4>
          <ul>
            ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
        
        <div class="disclaimer">
          <p><em>This assessment is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.</em></p>
        </div>
      `;
      
      modal.style.display = 'flex';
    }

    function closeResults() {
      document.getElementById('resultsModal').style.display = 'none';
      
      // Switch to the other assessment if completing PHQ-9
      if (currentAssessment === 'phq9') {
        if (confirm('Would you like to take the Anxiety Assessment (GAD-7) as well?')) {
          currentAssessment = 'gad7';
          totalQuestions = 7;
          currentQuestion = 1;
          selectedAnswers = {};
          updateQuestion();
        } else {
          resetAssessment();
        }
      } else {
        resetAssessment();
      }
    }

    function goToResources() {
      alert('Redirecting to mental health resources...');
      // window.location.href = 'resources.html';
    }

    function resetAssessment() {
      currentAssessment = 'phq9';
      currentQuestion = 1;
      totalQuestions = 9;
      selectedAnswers = {};
      updateQuestion();
    }

    // Initialize the assessment
    document.addEventListener('DOMContentLoaded', function() {
      updateQuestion();
    });