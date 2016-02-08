/**
 * Created by wok on 08.02.16.
 */

class Task {
    constructor(id) {
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
    }

    get text() {return this._task.text;}
    set text(newText) {this._task.text = newText;}
    get prio() {return this._task.prio;}
    set prio(newPrio) {this._task.prio = newPrio;}
    get tags() {return this._task.tags;}
    set tags(newTags) {this._task.tags = newTags;}
    get star() {return this._task.star;}
    set star(newStar) {this._task.star = newStar;}
    get startDate() {return this._task.startDate;}
    set startDate(newStartDate) {this._task.startDate = newStartDate;}
    get dueDate() {return this._task.dueDate;}
    set dueDate(newDueDate) {this._task.dueDate = newDueDate;}
    get checked() {return this._task.checked;}
    set checked(newChecked) {this._task.checked = newChecked;}

    save () {
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

        this._id = Tasks.insert(this._task);
    }

    _updateToDB() {
        if (!this._id || this._id == "") {
            throw "Task._updateToDB(): no valid this._id!";
        }

        this._task.dateLastWrite = new Date();
        Tasks.update(this._id,
            {$set: this._task});
    }
}

this.Task = Task;