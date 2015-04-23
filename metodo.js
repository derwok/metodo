
// Meteor.startup(function () {...}

Tasks = new Mongo.Collection("tasks");
Searches = new Mongo.Collection("searches");

////////// Client Code! /////////
if (Meteor.isClient) {
    Meteor.subscribe("tasks", function() {
    });
    Meteor.subscribe("searches", function() {
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });

    Session.set("setting.showCompleted", false);
}  // Meteor.isClient


////////// Server Code! /////////
if (Meteor.isServer) {
    Meteor.publish("tasks", function () {
        return Tasks.find({owner: this.userId});
    });
    Meteor.publish("searches", function () {
        return Searches.find({owner: this.userId});
    });

    Searches.remove({});
     // *** database/schema migration hook ***
    //var tasks = Tasks.find().forEach(function(task){
    //    console.log("Task:"+task.text);
    //    Tasks.update(task._id, {$set: {prio: task.prio * 1}});    // convert prio from string to number
    //});
}


////////// Client & Server Code! /////////
Meteor.methods({
    addTask: function (text) {
        console.log("Meteor.methods.addTask");
        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        var orgText = text;
        var result = taskParseAll(text);
        var currentDate = new Date();
        Tasks.insert({
            owner: Meteor.userId(),
            username: Meteor.user().username,

            orgText: orgText,
            text: result.text,
            prio: result.prio,
            tags: result.tags,
            star: result.star,
            createdAt: currentDate,
            dateLastWrite: currentDate
        });
    },

    updateTask: function (id, text) {
        console.log("Meteor.methods.updateTask");
        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        var orgText = text;                 // TODO: Code Duplicate with addTask !!!
        var result = taskParseAll(text);

        Tasks.update(id, {
            owner: Meteor.userId(),
            username: Meteor.user().username,

            orgText: orgText,
            text: result.text,
            prio: result.prio,
            tags: result.tags,
            star: result.star,
            dateLastWrite: new Date()
        });
    },

    deleteTask: function (taskId) {
        console.log("Meteor.methods.deleteTask");
        Meteor.defer(function () {
            Tasks.remove(taskId);
        });
    },

    removeAllTasks: function () {
        console.log("Meteor.methods.removeAllTasks");
        Tasks.remove({});
    },

    insertTaskObject: function (taskObject) {
        console.log("Meteor.methods.insertTaskObject");

        taskObject["owner"] = Meteor.userId();
        taskObject["username"] = Meteor.user().username;
        taskObject["dateLastWrite"] = new Date(taskObject["dateLastWrite"]);
        taskObject["createdAt"] = new Date (taskObject["createdAt"]);

        Tasks.insert(taskObject);
    },

    setChecked: function (taskId, setChecked) {
        console.log("Meteor.methods.setChecked");
        Tasks.update(taskId, {$set: {checked: setChecked,
                                    dateLastWrite: new Date()}});
    },

    setStar: function (taskId, setStar) {
        console.log("Meteor.methods.setStar");
        var task = Tasks.findOne(taskId);
        if (task) {
            var orgText = task.orgText;
            if (setStar) {
                orgText += " **";
            } else {
                orgText = orgText.replace(/\s*\*\*/, "");
            }
        }
        Tasks.update(taskId, {$set: {star: setStar,
            orgText: orgText,
            dateLastWrite: new Date()}});
    },

    addSearch: function (searchtext) {
        console.log("Meteor.methods.addSearch");
        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        searchtext = searchtext.toLowerCase().trim();
        Searches.remove({searchText: {$in: [searchtext]}});
        Searches.insert({
            owner: Meteor.userId(),
            searchText: searchtext,
            dateLastWrite: new Date()
        });

        // clean up
        if(Searches.find().count() > 2 * DEFAULT_MAX_SEARCHHISTORY_LENGTH){
            var allSearches = Searches.find({}, {sort: [["dateLastWrite","desc"]], limit: DEFAULT_MAX_SEARCHHISTORY_LENGTH}).fetch();
            var searchIDs = [];
            for (var i = 0; i < allSearches.length; i++) {
                searchIDs.push(allSearches[i]._id);
            }
            Searches.remove({_id: {$nin: searchIDs}});
            console.log("Number of searches after clean up: "+Searches.find().count());
        }
    }
});

//if (Meteor.isServer) {
//    if (Searches.find().count() == 0) {
//        Meteor.call("addSearch", "?@work");
//        Meteor.call("addSearch", "?!@work");
//        Meteor.call("addSearch", "?\*\*");
//        Meteor.call("addSearch", "?!@");
//    }
//}