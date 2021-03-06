/**
 * Created by wok on 08.02.16.
 */

class Task {
    constructor(id) {
        this._id = null;
        if (id && id != "") {
            this._id = id;                  // remember outside of _task object
            this._task = Tasks.findOne(id);
            if (this._task) {
                delete this._task._id;      // for easy updating, remember outside!
            }
        }
        if (!this._task) {
            this._task = {};
        }
    }

    get id() {return this._id;}
    get rawTask() {return this._task;}
    get owner() {return this._task.owner;}
    set owner(newOwner) {this._task.owner = newOwner;}
    get username() {return this._task.username;}
    set username(newUsername) {this._task.username = newUsername;}
    get orgText() {return this._task.orgText;}
    set orgText(newOrgText) {
        this._task.orgText = newOrgText;
        var parser = new TaskParser(this._task.orgText);
        var parseResult = parser.parse();
        this._task.text = parseResult.text;
        this._task.prio = parseResult.prio;
        this._task.tags = parseResult.tags;
        this._task.star = parseResult.star;
        this._task.startDate = parseResult.startDate;
        this._task.dueDate = parseResult.dueDate;
        this._checkForContextDone();
    }

    get text() {return this._task.text;}
    set text(newText) {this._task.text = newText;}
    get prio() {return this._task.prio;}
    set prio(newPrio) {this._task.prio = newPrio;}
    get tags() {return this._task.tags;}
    set tags(newTags) {this._task.tags = newTags;}
    get star() {return this._task.star;}
    set star(newStar) {
        this._task.star = newStar;
        if (newStar) {
            this._task.orgText += " **";
        } else {
            this._task.orgText = this._task.orgText.replace(/\s*\*\*/, "");
        }
    }
    get startDate() {return this._task.startDate;}
    set startDate(newStartDate) {this._task.startDate = newStartDate;}
    get dueDate() {return this._task.dueDate;}
    set dueDate(newDueDate) {this._task.dueDate = newDueDate;}
    get checked() {return this._task.checked;}
    set checked(newChecked) {
        // If task has repeat activated, we must clone a time-shifted version
        if (!this._task.checked && this._task.repeat && this._task.repeat.repeat) {
            var taskRepeater = new TaskRepeater(this);
        }
        this._task.checked = newChecked;
    }
    get createdAt() {return this._task.createdAt; }
    get dateLastWrite() {return this._task.dateLastWrite; }
    get notes() {return this._task.notes;}
    set notes (newNotes) {
        this._task.notes = newNotes;
        this._task.hasDetails = ((this._task.notes.length > 0) || (this._task.repeat && this._task.repeat.repeat));
    }
    get repeat() {return this._task.repeat;}
    set repeat (newRepeat) {
        this._task.repeat = newRepeat;
        this._task.hasDetails = ((this._task.repeat && this._task.repeat.repeat) || (this._task.notes && this._task.notes.length > 0));
    }

    cloneFromTask(templateTask) {
        this._task = JSON.parse(JSON.stringify(templateTask.rawTask)); // deep copy of object
        this._fixDateObjectsRecursive(this._task);
        this._id = null;
        delete this._task._id;
    }

    cloneFromRawTaskObj(templateRawTaskObj) {
        this._task = templateRawTaskObj;
        this._fixDateObjectsRecursive(this._task);
        this._id = null;
        delete this._task._id;
    }

    // userID (aka owner) & userName are optional!
    save (userID, userName) {
        if (userID) {
            this.owner = userID;
        }
        if (userName) {
            this.username = userName;
        }
        if (this._id) {
            this._updateToDB();
        } else {
            this._insertToDB();
        }
    }

    toString () {
        return JSON.stringify(this, null, 4);
    }

    log () {
        console.log(this.toString());
    }



    // ############### PRIVATE ##############################################################

    _insertToDB() {
        var currentDate = new Date();
        this._task.createdAt = currentDate;
        this._task.dateLastWrite = currentDate;

        var that = this;  // remember the context since in callback it is changed
        Tasks.insert(this._task, function(error, result) {
            that._id = result;
        });
    }

    _updateToDB() {
        if (!this._id || this._id == "") {
            throw "Task._updateToDB(): no valid this._id!";
        }

        this._task.dateLastWrite = new Date();
        Tasks.update(this._id,
            {$set: this._task});
    }


    _fixDateObjectsRecursive(taskObject) {
        for (var property in taskObject) {
            if (taskObject.hasOwnProperty(property)) {
                if (typeof taskObject[property] == "object"){
                    this._fixDateObjectsRecursive(taskObject[property]);
                }else{
                    //found a property which is not an object, check if its a date string
                    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+Z$/.test(taskObject[property])) {
                        taskObject[property] = new Date(taskObject[property]);
                    }
                }
            }
        }

    };

    _checkForContextDone() {
        if (this._task.tags) {
            var doneIndex = this._task.tags.indexOf("@done");
            if (doneIndex >= 0) {
                this._task.tags.splice(doneIndex, 1);   // remove @done tag
                this.checked = true;
            }
        }
    }
}

this.Task = Task;
