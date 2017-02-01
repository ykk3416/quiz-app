/**
 * Created by Kevin_Kim on 8/30/16.
 */

function Question(question) {
    this.question = question.question;
    this.answerChoices = question.choices;
    this.correctIndex = question.correctIndex;
    this.correct = false;
}

Question.prototype = {
    constructor: Question,
    evaluate: function (index) {
        this.chosenIndex = index;
        this.correct = this.chosenIndex === this.correctIndex;
    }
};

function Subject() {
    var observers = [];
    return {
        add: function (observer) {
            observers.push(observer);
        },
        removeAll: function () {
            observers.length = 0;
        },
        notifyObservers: function () {
            observers.forEach(function (observer) {
                observer.notify();
            });
        }
    }
}

function QuestionsModel() {
    var subject = Subject(),
        questions = [],
        numberCorrect = 0,
        totalNumber = 0,
        questionNumber = 0;

    return {
        getQuestion: function () {
            return questions[questionNumber];
        },
        getQuestionsLength: function () {
            return questions.length;
        },
        getQuestionNumber: function () {
            return questionNumber;
        },
        addQuestion: function (data) {
            for (var i = 0; i < data.length; i++) {
                questions.push(new Question(data[i]));
            }
            totalNumber = questions.length;
            subject.notifyObservers();
        },
        nextQuestion: function () {
            questionNumber++;
            subject.notifyObservers();
        },
        back: function () {
            questionNumber--;
            subject.notifyObservers();
        },
        getTotalNumber: function () {
            return totalNumber;
        },
        getNumberCorrect: function () {
            return numberCorrect;
        },
        calcNumberCorrect: function () {
            for (var i = 0; i < questions.length; i++) {
                console.log(questions[i].correct);
                if (questions[i].correct) {
                    numberCorrect++;
                }
            }
        },
        register: function (args) {
            subject.removeAll();
            for (var i = 0; i < arguments.length; i++) {
                subject.add(arguments[i]);
            }
        }
    }
}

function Handler(view, model) {
    var DOM = view.getDOM();
    return {
        notify: function () {
            var handler = function (event) {
                switch (event.target) {
                    case DOM.next:
                        if (model.getQuestionNumber() < model.getQuestionsLength()) {
                            var question = model.getQuestion();
                            DOM.choices.forEach(function (choice, count) {
                                if (choice.checked) {
                                    question.evaluate(count);
                                    if (model.getQuestionNumber() === model.getQuestionsLength() - 1) {
                                        model.calcNumberCorrect();
                                    }
                                }
                            });
                            //Have to check for validity since HTML5 validation API won't work for click events.
                            if (DOM.quiz.checkValidity()) {
                                DOM.$quiz.fadeOut("fast", function () {
                                    model.nextQuestion()
                                });
                                DOM.$quiz.fadeIn("fast");
                            }
                            else {
                                alert("Please answer the question.");
                                break;
                            }
                        }
                        else {
                            location.reload();
                        }
                        //Remove handler each time so that clicks aren't being registered multiple times.
                        DOM.quiz.removeEventListener("click", handler, false);
                        break;
                    case DOM.back:
                        if (model.getQuestionNumber() > 0) {
                            var question = model.getQuestion();
                            DOM.choices.forEach(function (choice, count) {
                                if (choice.checked) {
                                    question.evaluate(count);
                                }
                            });
                            model.back();
                            console.log(model.getQuestionNumber());
                            DOM.quiz.removeEventListener("click", handler, false);
                        }
                        else {
                            alert("This is the first question!");
                        }
                        break;
                    default:
                        //Need to break for any other event targets so that the form can keep listening for clicks.
                        break;
                }
            };
            DOM.quiz.addEventListener("click", handler, false);
        }
    };
}

function View(model) {
    var DOM = {
        $quiz: $(".quiz").find("form"),
        login: document.forms[0],
        quiz: document.forms[1],
        fieldset: document.forms[1].getElementsByTagName("fieldset")[0],
        choices: document.getElementsByName("choices"),
        next: document.getElementsByName("next")[0],
        back: document.getElementsByTagName("button")[0]
    };

    function getData() {
        //Using DocumentFragment to avoid continuously manipulating actual DOM.
        var label,
            docFrag = document.createDocumentFragment();
        if (model.getQuestionNumber() < model.getQuestionsLength()) {
            var input,
                div,
                labelForQuestion = document.createElement("label"),
                labelQuestion = document.createTextNode(model.getQuestion().question);
            labelForQuestion.className = "label-question";
            labelForQuestion.appendChild(labelQuestion);
            docFrag.appendChild(labelForQuestion);
            for (var i = 0; i < model.getQuestion().answerChoices.length; i++) {
                input = document.createElement("input");
                label = document.createElement("label");
                div = document.createElement("div");
                input.type = "radio";
                input.name = "choices";
                input.required = "true";
                label.className = "label-choices";
                input.value = model.getQuestion().answerChoices[i];
                div.className = "radio-circle";
                input.checked = i === model.getQuestion().chosenIndex;
                label.appendChild(input);
                label.appendChild(div);
                docFrag.appendChild(label);
                input.insertAdjacentHTML("afterend", input.value);
            }
        }
        //Display conclusions if finished
        else {
            var h1 = document.createElement("h1");
            label = document.createElement("label");
            h1.appendChild(document.createTextNode("You got " + model.getNumberCorrect() +
                " out of " + model.getTotalNumber() + "."));
            label.appendChild(h1);
            docFrag.appendChild(label);
            DOM.next.value = "Try again?";
            DOM.back.style.visibility = "hidden";
        }
        return docFrag;
    }

    return {
        getDOM: function () {
            return DOM;
        },
        notify: function () {
            DOM.fieldset.innerHTML = "";
            DOM.fieldset.appendChild(getData());
        }
    };
}

function Initialize() {
    var form = document.forms[0],
        sections = document.getElementsByTagName("section"),
        username = form.elements["username"].value,
        password = form.elements["password"].value,
        date = new Date();
    date.setDate(date.getDate()+1);
    sections[0].style.visibility = "hidden";
    sections[1].style.visibility = "visible";
    if (form.elements["remember"].checked) {
        //Made a subcookie so that it can be overwritten at every initialization.
        document.cookie = encodeURIComponent("data") + "=" + encodeURIComponent(username) + "=" +
            encodeURIComponent(password) + "; expires=" + date.toDateString();
    }
    if (localStorage.getItem(username) === password) {
        alert("Welcome back " + username + "!");
    }
    localStorage.setItem(username, password);
    event.target.removeEventListener("click", arguments.callee);
}

(function() {
    var model = QuestionsModel(),
        view = View(model),
        handler = Handler(view, model),
        request = new XMLHttpRequest();
    model.register(handler, view);
    request.open("GET", "assets/javascript/questions.json", true);
    request.setRequestHeader("Content-type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState == 4 && request.status == 200) {
            var Response = JSON.parse(request.responseText);
            model.addQuestion(Response);
        }
    };
    request.send();
})();

/*
 I get a "Uncaught (in promise) error" when trying to access document.cookie after quitting the browser,
 so document.cookie only lasts for one session. Not sure why this happens.
 */
if (document.cookie) {
    document.forms[0].elements["username"].value = document.cookie.substring(5, document.cookie.indexOf("=", 5));
    document.forms[0].elements["password"].value = document.cookie.substring(document.cookie.lastIndexOf("=") + 1,
        document.cookie.length);
}
document.getElementsByClassName("btn")[0].addEventListener("click", Initialize, false);








