define([
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'base/js/utils',

], function ($, Jupyter, dialog, utils) {
    "use strict";

    var nbgrader_version = "0.7.0.dev";

    var ajax = utils.ajax || $.ajax;
    // Notebook v4.3.1 enabled xsrf so use notebooks ajax that includes the
    // xsrf token in the header data

    var checkNbGraderVersion = function (callback) {
        var settings = {
            cache : false,
            type : "GET",
            dataType : "json",
            data : {
                version: nbgrader_version
            },
            success : function (response) {
                if (!response['success']) {
                    var body = $("<div/>").text(response['message']);
                    dialog.modal({
                        title: "Version Mismatch",
                        body: body,
                        buttons: { OK: { class : "btn-primary" } }
                    });
                } else {
                    callback();
                }
            },
            error : utils.log_ajax_error,
        };
        var url = utils.url_path_join(Jupyter.notebook.base_url, 'nbgrader_version');
        ajax(url, settings);
    };

    /////////////////
	//  GET COURSE ID
	/////////////////
    var course_id = '';
    var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : function (data, status, xhr) { 
		if (data.success) {
			// assumes just one course enrolled in jupytherub instance
			course_id = data.value[0];
		} else {
			utils.log_ajax_error(xhr, status, error);
			var body = $("<div/>").text("Error fetching courses!");
			dialog.modal({
				title: "Error",
				body: body,
				buttons: { OK: { class : "btn-primary" } }
		 	});
		}
	    },
    };
    var url = utils.url_path_join(
        Jupyter.notebook.base_url,
	'courses'
    );
    ajax(url, settings);

    var add_button = function () {
        var maintoolbar = $("#maintoolbar-container");
        var btn_group = $("<div />").attr("class", "btn-group")
        var btn = $("<button />").attr("class", "btn btn-default submit").text("Submit");
        btn_group.append(btn)
        maintoolbar.append(btn_group);

        btn.click(function (e) {
            checkNbGraderVersion(function () {
                var p = Jupyter.notebook.save_notebook();
                p.then(function () {
                    var settings = {
                        cache : false,
                        //data : { path: Jupyter.notebook.notebook_path },
                        data : {
                            //course_id: that.data.course_id,
                            //assignment_id: that.data.assignment_id
                            course_id: course_id,
                            assignment_id: Jupyter.notebook.notebook_path.split('/')[0]
                        },
                        type : "POST",
                        dataType : "json",
                        success : function (data, status, xhr) {
                            //btn.text('Validate');
                            //btn.removeAttr('disabled');
                            //validate(data, btn);
			    btn.text('Submit');
			    btn.removeAttr('disabled');
                            if (!data.success) {
                                submit_error(data);
                            } else {
                                //that.on_refresh(data, status, xhr);
                                console.log('figure out on_refresh.');
                            }
                        },
                        error : function (xhr, status, error) {
                            //utils.log_ajax_error(xhr, status, error);
			    //btn_group.empty().text("Error submitting assignment.");
			    utils.log_ajax_error(xhr, status, error);
				var body = $("<div/>").text("Error submitting assignment.");
				dialog.modal({
					title: "Error",
					body: body,
					buttons: { OK: { class : "btn-primary" } }
				});
                        }
                    };
                    btn.text('Submitting...');
                    btn.attr('disabled', 'disabled');
                    var url = utils.url_path_join(
                        Jupyter.notebook.base_url,
                        'assignments',
                        'submit'
                    );
                    ajax(url, settings);
                });
            });
        });
    };

    var submit_error = function (data) {
        var body = $('<div/>').attr('id', 'submission-message');

        body.append(
            $('<div/>').append(
                $('<p/>').text('Assignment not submitted:')
            )
        );
        body.append(
            $('<pre/>').text(data.value)
        );

        dialog.modal({
            title: "Invalid Submission",
            body: body,
            buttons: { OK: { class : "btn-primary" } }
        });
    };

    var load_extension = function () {
        add_button();
        console.log('nbgrader extension for submitting notebooks loaded.');
    };

    return {
        'load_ipython_extension': load_extension
    };
});
