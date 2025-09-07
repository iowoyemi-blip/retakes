/* 2.1 Quiz Retake — external JS (CSP-safe) */
(function(){
  'use strict';
  var logEl = document.getElementById('log');
  function log(msg){ try{ logEl.textContent += msg + '\\n'; }catch(e){} }
  window.addEventListener('error', function(e){ log('Error: ' + e.message + ' @ ' + (e.filename||'') + ':' + (e.lineno||'')); });
  window.addEventListener('unhandledrejection', function(e){ log('Promise rejection: ' + (e.reason && e.reason.message || e.reason)); });

  var studentName = ''; var score = 0; var answered = 0;

  var start = document.getElementById('start');
  var quiz = document.getElementById('quiz');
  var who = document.getElementById('who');
  var nameInput = document.getElementById('name');
  var qs = document.getElementById('qs');
  var done = document.getElementById('done');
  var scoreBox = document.getElementById('score');
  var statusEl = document.getElementById('status');
  var goBtn = document.getElementById('go');
  var resetBtn = document.getElementById('reset');

  function updateScore(total){ scoreBox.textContent = 'Score: ' + score + ' / ' + answered + ' (Total: ' + total + ')'; }

  function parseNumeric(s){
    if(!s) return NaN;
    var raw = (''+s).trim().replace(/\\s+/g,'');
    if(/^[-+]?\\d+\\/[-+]?\\d+$/.test(raw)){
      var parts = raw.split('/'); var a = Number(parts[0]); var b = Number(parts[1]);
      if(b===0) return NaN; return a/b;
    }
    return Number(raw);
  }
  function eq(a,b){ return Math.abs(a-b) <= 1e-9; }

  var Q = [
    { tex:'Evaluate: $$12-4+6$$', html:'Evaluate: <span class=\"math\">12 − 4 + 6</span>', val:14, sol:'Compute left to right: 12−4=8; 8+6=14.'},
    { tex:'Evaluate: $$24\\\\div 4\\\\cdot 2$$', html:'Evaluate: <span class=\"math\">24 ÷ 4 <span class=\"dot\">·</span> 2</span>', val:12, sol:'Division then multiplication (left to right): 24÷4=6; 6·2=12.'},
    { tex:'Evaluate: $$40-30\\\\div6\\\\cdot3-20$$', html:'Evaluate: <span class=\"math\">40 − 30 ÷ 6 <span class=\"dot\">·</span> 3 − 20</span>', val:5, sol:'30÷6=5; 5·3=15; then 40−15−20=5.'},
    { tex:'Evaluate: $$20-18\\\\div2+4-3(1-3)\\\\cdot3^{2}$$', html:'Evaluate: <span class=\"math\">20 − 18 ÷ 2 + 4 − 3<span class=\"paren\">(</span>1−3<span class=\"paren\">)</span> <span class=\"dot\">·</span> 3<span class=\"sup\">2</span></span>', val:69, sol:'18÷2=9; (1−3)=−2; 3²=9; 3·(−2)·9=−54; 20−9+4−(−54)=69.'},
    { tex:'Evaluate: $$\\\\dfrac{4^{2}-8}{3(7+4)-5}$$', html:'Evaluate: <span class=\"math\"><span class=\"frac\"><span class=\"num\">4<span class=\"sup\">2</span> − 8</span><span class=\"bar\"></span><span class=\"den\">3<span class=\"paren\">(</span>7+4<span class=\"paren\">)</span> − 5</span></span></span>', val:(16-8)/(3*(7+4)-5), sol:'4²=16 → numerator 8. Denominator: 3(11)=33; 33−5=28; 8/28=2/7.'},
    { tex:'Evaluate: $$|3-2^{2}|-|2^{2}-3|$$', html:'Evaluate: <span class=\"math\"><span class=\"abs\">3 − 2<span class=\"sup\">2</span></span> − <span class=\"abs\">2<span class=\"sup\">2</span> − 3</span></span>', val:0, sol:'2²=4 → |3−4|=1, |4−3|=1; 1−1=0.'}
  ];

  function renderKatexUpgrade(){
    try{
      if (window.renderMathInElement && window.katex){
        statusEl.textContent = 'KaTeX loaded — rendering math.';
        var texContainer = document.createElement('div');
        texContainer.innerHTML = Q.map(function(q,i){ return '<div class=\"qtex\" data-i=\"'+i+'\">'+q.tex+'</div>'; }).join('');
        document.body.appendChild(texContainer);
        window.renderMathInElement(texContainer, { delimiters:[{left:'$$', right:'$$', display:true},{left:'\\(', right:'\\)', display:false}] });
        Array.prototype.forEach.call(texContainer.querySelectorAll('.qtex'), function(div){
          var i = Number(div.getAttribute('data-i'));
          var qLine = qs.children[i].querySelector('.qline');
          var numberHtml = qLine.querySelector('strong').outerHTML;
          qLine.innerHTML = numberHtml + ' ' + div.innerHTML;
        });
        texContainer.remove();
      } else {
        statusEl.textContent = 'KaTeX not loaded — using offline math display.';
      }
    } catch(err){ log('KaTeX upgrade error: ' + err.message); statusEl.textContent = 'Math upgrade failed — fallback in use.'; }
  }

  function updateHandlers(card, i, q){
    var btn = card.querySelector('#btn-'+i);
    var field = card.querySelector('#ans-'+i);
    var sol = card.querySelector('#sol-'+i);
    btn.addEventListener('click', function(){
      var val = parseNumeric(field.value);
      var ok = Number.isFinite(val) && eq(val, q.val);
      answered++;
      if (ok){ score++; field.classList.add('answer-ok'); }
      else { field.classList.add('answer-err'); sol.classList.remove('hidden'); sol.textContent = 'Correct answer: ' + (Math.abs(q.val - 2/7) < 1e-9 ? '2/7' : q.val); }
      field.disabled = true; btn.disabled = true;
      updateScore(Q.length);
      sol.classList.remove('hidden');
      sol.innerHTML = '<div><strong>Solution:</strong> ' + q.sol + '</div>';
      if (answered === Q.length && score === Q.length){
        done.innerHTML = '<div class=\"card\"><h2 style=\"margin:0 0 6px 0;\">Mastery Achieved!</h2><p class=\"muted\">Great work! Download verification below.</p><button id=\"dl\" class=\"btn mt\">Download Verification File</button></div>';
        done.classList.remove('hidden');
        document.getElementById('dl').addEventListener('click', function(){
          var data = { studentName: studentName, quizTitle:'2.1 Quiz Retake', completionDate:new Date().toISOString(),
            masteryAttempt:{ score:score, totalQuestions:Q.length, percentage:100, questions: Q.map(function(q,i){ return {number:i+1, question:q.tex.replace(/\\$\\$/g,''), correctValue:q.val}; }) } };
          var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = (studentName.replace(/[^a-z0-9]/gi,'_').toLowerCase()) + '_quiz_2-1_retake.json';
          document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        });
      }
    });
  }

  function render(){
    score = 0; answered = 0; updateScore(Q.length);
    done.classList.add('hidden'); done.innerHTML = '';
    qs.innerHTML = '';
    Q.forEach(function(q,i){
      var card = document.createElement('div'); card.className = 'card mt';
      card.innerHTML = '<div class=\"row\" style=\"justify-content:space-between; align-items:flex-start;\"><div class=\"qline\"><strong>'+(i+1)+'.</strong> '+q.html+'</div><span class=\"badge\">Evaluate</span></div><div class=\"row mt\"><input id=\"ans-'+i+'\" class=\"field\" placeholder=\"Enter number or fraction, e.g., 2/7\"/><button id=\"btn-'+i+'\" class=\"btn\">Submit</button></div><div id=\"sol-'+i+'\" class=\"hidden mt muted\"></div>';
      qs.appendChild(card);
      updateHandlers(card, i, q);
    });
    setTimeout(renderKatexUpgrade, 100);
  }

  function startQuiz(){
    var n = nameInput.value.trim();
    if(!n){ alert('Please enter your name to start.'); return; }
    studentName = n; who.textContent = studentName;
    start.classList.add('hidden'); quiz.classList.remove('hidden');
    statusEl.textContent = 'Starting…';
    render();
  }

  // Attach listeners after DOM is ready
  document.addEventListener('DOMContentLoaded', function(){
    goBtn.addEventListener('click', startQuiz);
    resetBtn.addEventListener('click', render);
    statusEl.textContent = (window.renderMathInElement && window.katex) ? 'KaTeX detected.' : 'Waiting for KaTeX… (fallback ready)';
  });

  window.addEventListener('load', function(){
    if (!(window.renderMathInElement && window.katex)){
      statusEl.textContent = 'KaTeX not detected; using fallback display.';
    }
  });
})();