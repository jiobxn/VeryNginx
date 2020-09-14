var config = new Object();

function GUID() {
    this.date = new Date();

    /* 判断是否初始化过，如果初始化过以下代码，则以下代码将不再执行，实际中只执行一次 */
    if (typeof this.newGUID != 'function') {

        /* 生成GUID码 */
        GUID.prototype.newGUID = function () {
            this.date = new Date();
            var guidStr = '';
            sexadecimalDate = this.hexadecimal(this.getGUIDDate(), 16);
            sexadecimalTime = this.hexadecimal(this.getGUIDTime(), 16);
            for (var i = 0; i < 9; i++) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            guidStr += sexadecimalDate;
            guidStr += sexadecimalTime;
            while (guidStr.length < 32) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            return this.formatGUID(guidStr);
        }

        /*
         * 功能：获取当前日期的GUID格式，即8位数的日期：19700101
         * 返回值：返回GUID日期格式的字条串
         */
        GUID.prototype.getGUIDDate = function () {
            return this.date.getFullYear() + this.addZero(this.date.getMonth() + 1) + this.addZero(this.date.getDay());
        }

        /*
         * 功能：获取当前时间的GUID格式，即8位数的时间，包括毫秒，毫秒为2位数：12300933
         * 返回值：返回GUID日期格式的字条串
         */
        GUID.prototype.getGUIDTime = function () {
            return this.addZero(this.date.getHours()) + this.addZero(this.date.getMinutes()) + this.addZero(this.date.getSeconds()) + this.addZero(parseInt(this.date.getMilliseconds() / 10));
        }

        /*
        * 功能: 为一位数的正整数前面添加0，如果是可以转成非NaN数字的字符串也可以实现
         * 参数: 参数表示准备再前面添加0的数字或可以转换成数字的字符串
         * 返回值: 如果符合条件，返回添加0后的字条串类型，否则返回自身的字符串
         */
        GUID.prototype.addZero = function (num) {
            if (Number(num).toString() != 'NaN' && num >= 0 && num < 10) {
                return '0' + Math.floor(num);
            } else {
                return num.toString();
            }
        }

        /*
         * 功能：将y进制的数值，转换为x进制的数值
         * 参数：第1个参数表示欲转换的数值；第2个参数表示欲转换的进制；第3个参数可选，表示当前的进制数，如不写则为10
         * 返回值：返回转换后的字符串
         */
        GUID.prototype.hexadecimal = function (num, x, y) {
            if (y != undefined) {
                return parseInt(num.toString(), y).toString(x);
            } else {
                return parseInt(num.toString()).toString(x);
            }
        }

        /*
         * 功能：格式化32位的字符串为GUID模式的字符串
         * 参数：第1个参数表示32位的字符串
         * 返回值：标准GUID格式的字符串
         */
        GUID.prototype.formatGUID = function (guidStr) {
            var str1 = guidStr.slice(0, 8) + '-',
                str2 = guidStr.slice(8, 12) + '-',
                str3 = guidStr.slice(12, 16) + '-',
                str4 = guidStr.slice(16, 20) + '-',
                str5 = guidStr.slice(20);
            return str1 + str2 + str3 + str4 + str5;
        }
    }
}

Vue.config.debug = true;
config.config_vm = null;
config.verynginx_config = {};

config.original_config_json = null;

//the reusable matcher condition template
config.vue_component_condition = Vue.extend({
    props: ['matcher_conditions', 'del_action'],
    template: '<template v-for="(condition_name,condition_value) in matcher_conditions | orderBy \'v\'">\
                   <div class="config_matcher_block">\
                       <span class="glyphicon glyphicon-remove config_matcher_block_btn_delete" v-if="(del_action != null)" onclick="{{del_action}}"></span>\
                       <span class="config_matcher_block_type">{{condition_name}}</span>\
                       <span class="config_matcher_block_name">\
                           <template v-if="(condition_value.name_operator != null)">[ name\
                               {{ condition_value.name_operator}}\
                               <template v-if="(condition_value.name_value != null)">\
                                   {{condition_value.name_value }}\
                               </template>\
                           ]</template>\
                       </span>\
                       <span class="config_matcher_block_operator">{{condition_value.operator | show_operator}}</span>\
                       <span class="config_matcher_block_value" >{{condition_value.value}}</span>\
                   </div>\
               </template>'
});

config.vue_upstream_node = Vue.extend({
    props: ['node', 'del_action'],
    template: '<template v-for="(node_name,node_value) in node ">\
              <div class="config_matcher_block">\
                  <span class="glyphicon glyphicon-remove config_matcher_block_btn_delete" v-if="(del_action != null)" onclick="{{del_action}}"></span>\
                  <span class="config_matcher_block_type">{{node_name}}</span>\
                  <span class="config_matcher_block_name">\
                      {{node_value.scheme}}://{{node_value.host}}<template v-if="(node_value.port.length != 0)">:{{node_value.port}};</template>\
                  </span>\
                  <span class="config_node_block_weight"> weight:{{node_value.weight}}</span>\
              </div>\
          </template>'
});

Vue.component('condition', config.vue_component_condition);
Vue.component('upstream', config.vue_upstream_node);

Vue.filter('show_operator', function (operator) {
    return operator;
});

config.config_changed = function () {

    if (config.config_vm == null)
        return false;

    var original_config = JSON.parse(config.original_config_json);
    var new_config = JSON.parse(config.config_vm.all_config_json);

    if (_.isEqual(original_config, new_config) == true)
        return false;
    else
        return true;
}

config.refresh_bottom_bar = function () {

    if (config.config_changed()) {
        $('#config_bottom_div').show();
    } else {
        $('#config_bottom_div').hide();
    }
};

config.reset_input_form = function () {
    util.reset_input_area('.config_form')
}

config.createPage = function (currentPage, totalPages, config_vm) {
    if (totalPages > 0) {
        $("#blackwhitepage").bootstrapPaginator({
            //设置版本号
            bootstrapMajorVersion: 3,
            // 显示第几页
            currentPage: currentPage,
            // 总页数
            totalPages: totalPages,
            //当单击操作按钮的时候, 执行该函数, 调用ajax渲染页面
            onPageClicked: function (event, originalEvent, type, page) {
                $.ajax({
                    url: "./blackwhite/list?pageIndex=" + page + "&pageSize=15",
                    dataType: "json",
                    type: "POST",
                    success: function (datapage) {
                        config_vm.black_white_list = datapage.black_whites;
                        config.createPage(datapage.currentPage, datapage.totalPages, config_vm);
                    }
                });
            }
        });
    }
}

config.get_config = function () {
    // $.get("./config"), $.get("./blackwhite")
    $.when($.ajax({url: "./config", dataType: "json", type: "GET"}), $.ajax({url: "./blackwhite/list?pageIndex=1&pageSize=15", dataType: "json", type: "POST"}))
        .done(function (data, data2) {
            config.original_config_json = JSON.stringify(data, null, 2);
            config.black_white_list = [];
            // config.black_white_list = data.black_white_list.slice(0);
            // config.black_white_list = [{"matcher": "all_request", "enable": false, "ip": "127.0.0.1111", "action": "accept"}];
            // data.black_white_list = [];
            config.verynginx_config = data[2].responseJSON;

            if (config.verynginx_config.black_white_list_change) {
                $('#config_bottom_div').show();
            }

            if (config.config_vm != null) {
                config.config_vm.$set('config_now', data);
                dashboard.notify("Reread config success");
                return;
            }
            config.config_vm = new Vue({
                el: '#verynginx_config',
                data: {
                    'config_now': config.verynginx_config,
                    'black_white_list': data2[2].responseJSON.black_whites,
                    'editor': {}
                },
                computed: {
                    all_config_json: function () {
                        return JSON.stringify(this.config_now, null, 2);
                    }
                },
                ready: function () {
                    this.$nextTick(config.reset_input_form);
                }
            });
            config.createPage(data2[2].responseJSON.currentPage, data2[2].responseJSON.totalPages, config.config_vm);
            config.config_vm.$watch('all_config_json', config.refresh_bottom_bar);
        }, function (data1, data2) {

        });
}


config.save_config = function () {
    console.log("save_config");
    var config_json = JSON.stringify(config.config_vm.$data['config_now'], null, 2);

    //step 1, use encodeURIComponent to escape special char 
    var config_json_escaped = window.encodeURIComponent(config_json);
    //step 2, use base64 to encode data to avoid be blocked by verynginx args filter
    var config_json_escaped_base64 = window.btoa(config_json_escaped);

    $.post("./config", {config: config_json_escaped_base64}, function (data) {
        console.log(data);
        if (data['ret'] == 'success') {
            config.original_config_json = config.config_vm.all_config_json;
            config.refresh_bottom_bar();
            dashboard.notify("Save config success.");
        } else {
            dashboard.show_notice('warning', "Save config failed [" + data['err'] + "].");
        }
    });
}

//modify: give group, index ,value
//delete: let value = null
//add: let index == null 
config.config_mod = function (rule_group_name, index, value) {

    if (index == null && value == null) {
        //is a error call
        return;
    }

    console.log('-->', rule_group_name, index, value);
    if (value == null) {
        if (typeof index == 'string') {
            Vue.delete(config.verynginx_config[rule_group_name], index);
        } else {
            config.verynginx_config[rule_group_name].splice(index, 1);
        }
    } else {
        if (index == undefined || index == null) {
            config.verynginx_config[rule_group_name].push(value);
        } else if (typeof index == 'string') {
            Vue.set(config.verynginx_config[rule_group_name], index, value);
        } else {
            config.verynginx_config[rule_group_name].$set(index, value);
        }
    }
}


config.config_move_up = function (rule_group_name, index) {

    if (index == 0) {
        dashboard.notify("The item already at the first");
        return;
    }

    var tmp = config.verynginx_config[rule_group_name][index - 1];
    config.verynginx_config[rule_group_name].$set(index - 1, config.verynginx_config[rule_group_name][index]);
    config.verynginx_config[rule_group_name].$set(index, tmp);
}

config.config_move_down = function (rule_group_name, index) {
    if (index >= config.verynginx_config[rule_group_name].length - 1) {
        dashboard.notify("The item already at the bottom");
        return;
    }

    var tmp = config.verynginx_config[rule_group_name][index + 1];
    config.verynginx_config[rule_group_name].$set(index + 1, config.verynginx_config[rule_group_name][index]);
    config.verynginx_config[rule_group_name].$set(index, tmp);
}


config.edit_flag_set = function (group, flag) {
    var config_group = config.verynginx_config[group];
    config_group = JSON.parse(JSON.stringify(config_group));

    if (flag != null) {
        Object.defineProperty(config_group, "_editing", {value: flag, enumerable: false, writable: true});
    }
    //reset data to refresh the view
    config.config_vm.$set('config_now.' + group, config_group);
}

//set a rule to edit status and fill data of the rule into editor form
//default: include_key == undefined
config.config_edit_begin = function (rule_group_name, index, form_id, index_key_name) {
    var config_group = config.verynginx_config[rule_group_name];
    var data = util.clone(config_group[index]);
    if (index_key_name != undefined) {
        data[index_key_name] = index;
    }
    config.edit_flag_set(rule_group_name, index);
    vnform.set_data(form_id, data);
}

config.config_black_white_edit_begin = function (rule_group_name, index, form_id, index_key_name) {
    var config_group = config.config_vm.black_white_list;
    var data = util.clone(config_group[index]);
    if (index_key_name != undefined) {
        data[index_key_name] = index;
    }
    config.edit_flag_set(rule_group_name, index);
    vnform.set_data(form_id, data);
}

config.config_edit_save = function (rule_group_name, form_id, index_key_name) {
    var editing = config.verynginx_config[rule_group_name]._editing;
    var err_msg = vnform.verify_form(form_id);
    if (err_msg != null) {
        dashboard.show_notice('warning', err_msg);
        return;
    }

    var value = vnform.get_data(form_id);
    if (editing != undefined) {
        config.verynginx_config[rule_group_name]._editing = null;
    }

    if (index_key_name != undefined) {
        editing = value[index_key_name];
        delete value[index_key_name];
    }

    config.config_mod(rule_group_name, editing, value);
    config.edit_flag_set(rule_group_name, null);
    vnform.reset(form_id);

}

config.search_black_whites = function () {
    $.post("./blackwhite/list?pageIndex=1&pageSize=15", {search: $("#black_white_search").val()}, function (datapage) {
        config.config_vm.black_white_list = datapage.black_whites;
        config.createPage(1, datapage.totalPages, config.config_vm);
    });
}


config.del_black_whites = function (id) {
    $.post("./blackwhite/delete?pageIndex=1&pageSize=15", {id: id}, function (datapage) {
        $('#config_bottom_div').show();
        config.config_vm.black_white_list = datapage.black_whites;
        config.createPage(1, datapage.totalPages, config.config_vm);
    });
}
/**
 * 保存黑白名单
 * @param rule_group_name
 * @param form_id
 * @param index_key_name
 */
config.config_black_white_save = function (rule_group_name, form_id, index_key_name) {
    var editing = config.verynginx_config[rule_group_name]._editing;
    var err_msg = vnform.verify_form(form_id);
    if (err_msg != null) {
        dashboard.show_notice('warning', err_msg);
        return;
    }
    var value = vnform.get_data(form_id);
    console.log(value)
    if (editing != undefined) {
        config.verynginx_config[rule_group_name]._editing = null;
    }
    // if (!value.id) value.id = new GUID().newGUID();
    var config_json = JSON.stringify(value, null, 2);
    //step 1, use encodeURIComponent to escape special char
    var config_json_escaped = window.encodeURIComponent(config_json);
    //step 2, use base64 to encode data to avoid be blocked by verynginx args filter
    var config_json_escaped_base64 = window.btoa(config_json_escaped);
    $.post("./blackwhite", {config: config_json_escaped_base64}, function (data) {
        console.log(data);
        if (data['ret'] == 'success') {
            config.config_edit_cacel(rule_group_name, form_id);
            $('#config_bottom_div').show();
            // config.createPage(1, 15, config.config_vm);
            $.ajax({
                url: "./blackwhite/list?pageIndex=1&pageSize=15",
                dataType: "json",
                type: "POST",
                success: function (datapage) {
                    config.config_vm.black_white_list = datapage.black_whites;
                    config.createPage(1, datapage.totalPages, config.config_vm);
                }
            });
            dashboard.notify("Save config success.");
        } else {
            dashboard.show_notice('warning', "Save config failed [" + data['err'] + "].");
        }
    });
}

config.config_edit_cacel = function (rule_group_name, form_id) {
    config.edit_flag_set(rule_group_name, null);

    if (form_id != undefined) {
        vnform.reset(form_id);
    }
}


//for matcher only
config.config_matcher_delete_condition = function (matcher_name, condition_name) {
    Vue.delete(config.verynginx_config['matcher'][matcher_name], condition_name);
}

//add the content of matcher editor to global config
config.config_matcher_add = function () {
    var matcher_name = matcher_editor.matcher_name();

    if (matcher_name == '') {
        dashboard.notify('Name of the matcher mush not be empty');
        return;
    }

    if (matcher_name.substring(0, 1) == '_') {
        dashboard.notify('Name of the matcher must not started with "_"');
        return;
    }

    if (config.verynginx_config['matcher'][matcher_name] != null) {
        dashboard.notify('Matcher [' + matcher_name + '] already existed');
        return;
    }

    Vue.set(config.verynginx_config['matcher'], matcher_name, matcher_editor.tmp_conditions);
    matcher_editor.clear();
}


config.test_match_factory = function (type) {

    var match_core = function () {

        var target_str = $(this).val();
        var test_container = $(this).closest('.config_test_container');
        var rule_table_id = test_container.attr('test_rule_table');
        var rule_table = $('#' + rule_table_id);
        var test_args = eval(test_container.attr('test_args'));
        var test_output = test_container.find('.config_test_output');
        var test_sub_output = test_container.find('.config_test_sub_output');

        var rows = rule_table.find('tbody > tr');
        var matched_count = 0;

        test_output.text('');
        test_sub_output.text('');
        for (i = 0; i < rows.length; i++) {
            $(rows[i]).removeClass('matched');

            if (type == 're') {
                var re_str = $($(rows[i]).children()[test_args[0]]).text();
                var re_obj = new RegExp(re_str, 'igm');

                if (target_str.match(re_obj) != null) {
                    $(rows[i]).addClass('matched');
                    matched_count += 1;
                }
            }

            if (type == 're_replace') {
                var re_str = $($(rows[i]).children()[test_args[0]]).text();
                var replace_str = $($(rows[i]).children()[test_args[1]]).text();
                var re_obj = new RegExp(re_str, 'igm');

                if (target_str.match(re_obj) != null) {
                    $(rows[i]).addClass('matched');
                    matched_count += 1;

                    if (test_sub_output.text() == '') {
                        test_sub_output.text('will be redirect to: ' + target_str.replace(re_obj, replace_str));
                    }
                }
            }

            if (type == 'equal') {
                var re_str = $($(rows[i]).children()[test_args[0]]).text();

                if (target_str == re_str) {
                    $(rows[i]).addClass('matched');
                    matched_count += 1;
                }
            }

        }

        if (target_str == '' && matched_count == 0) {
            test_output.text('');
        } else {
            test_output.text(matched_count + ' rule matched ');
        }
    };

    return match_core;
}



