-- -*- coding: utf-8 -*-
-- -- @Date    : 2016-01-02 00:35
-- -- @Author  : Alexa (AlexaZhou@163.com)
-- -- @Link    : 
-- -- @Disc    : url router of verynginx's control panel 

local summary = require "summary"
local status = require "status"
local cookie = require "cookie"
local VeryNginxConfig = require "VeryNginxConfig"
local encrypt_seed = require "encrypt_seed"
local json = require "json"
local util = require "util"

local _M = {}

_M.url_route = {}
_M.mime_type = {}
_M.mime_type['.js'] = "application/x-javascript"
_M.mime_type['.css'] = "text/css"
_M.mime_type['.html'] = "text/html"

function _M.split(szFullString, szSeparator)
    local nFindStartIndex = 1
    local nSplitIndex = 1
    local nSplitArray = {}
    while true do
        local nFindLastIndex = string.find(szFullString, szSeparator, nFindStartIndex)
        if not nFindLastIndex then
            nSplitArray[nSplitIndex] = string.sub(szFullString, nFindStartIndex, string.len(szFullString))
            break
        end
        nSplitArray[nSplitIndex] = string.sub(szFullString, nFindStartIndex, nFindLastIndex - 1)
        nFindStartIndex = nFindLastIndex + string.len(szSeparator)
        nSplitIndex = nSplitIndex + 1
    end
    return nSplitArray
end

function _M.checkIp()
    --    ngx.log(ngx.STDERR, ngx.var.remote_addr)
    --    ngx.log(ngx.STDERR, ngx.var.x_real_ip)
    --    ngx.log(ngx.STDERR, ngx.var.x_forwarded_for)
    --
    local headers = ngx.req.get_headers()
    --    local ip = headers["X-REAL-IP"] or headers["X_FORWARDED_FOR"] or ngx.var.remote_addr
    --    ngx.log(ngx.STDERR, "============================" .. ip .. "====================")

    local clientIP = headers["x-forwarded-for"]
    if clientIP == nil or string.len(clientIP) == 0 or clientIP == "unknown" then
        clientIP = headers["Proxy-Client-IP"]
    end
    if clientIP == nil or string.len(clientIP) == 0 or clientIP == "unknown" then
        clientIP = headers["WL-Proxy-Client-IP"]
    end
    if clientIP == nil or string.len(clientIP) == 0 or clientIP == "unknown" then
        clientIP = ngx.var.remote_addr
    end
    -- 对于通过多个代理的情况，第一个IP为客户端真实IP,多个IP按照','分割
    if clientIP ~= nil and string.len(clientIP) > 15 then
        local pos = string.find(clientIP, ",", 1)
        clientIP = string.sub(clientIP, 1, pos - 1)
    end

--    ngx.log(ngx.STDERR, "============================" .. clientIP .. "====================")
    return clientIP
end

function _M.filter()
    local method = ngx.req.get_method()
    local uri = ngx.var.uri
    local base_uri = VeryNginxConfig.configs['base_uri']
    local dashboard_host = VeryNginxConfig.configs['dashboard_host']
    local login_ip = VeryNginxConfig.configs['login_ip']

    if dashboard_host ~= '' then
        if ngx.var.host ~= dashboard_host then
            return
        end
    end

    local ip = _M.checkIp()
    local verifyed = false
    if login_ip ~= '' and login_ip ~= nil then
        for i, item in pairs(_M.split(login_ip, ",")) do
            if item == ip then
                verifyed = true
            end
        end
        if verifyed ~= true then
            return
        end
    end

    if string.find(uri, base_uri) == 1 then
        local path = string.sub(uri, string.len(base_uri) + 1)

        for i, item in ipairs(_M.route_table) do
            if method == item['method'] and path == item['path'] then
                ngx.header.content_type = "application/json"
                ngx.header.charset = "utf-8"

                if item['auth'] == true and _M.check_session() == false then
                    local info = json.encode({ ["ret"] = "failed", ["message"] = "need login" })
                    ngx.status = 400
                    ngx.say(info)
                else
                    ngx.say(item['handle']())
                end
                ngx.exit(ngx.HTTP_OK)
            end
        end

        ngx.req.set_uri(path)
        ngx.var.vn_static_root = VeryNginxConfig.home_path() .. "/dashboard"
        ngx.var.vn_exec_flag = '1' -- use the var as a mark, so that lua can know that's a inside redirect
        util.ngx_ctx_dump()
        return ngx.exec('@vn_static') -- will jump out at the exec 
    end
end

function _M.check_session()
    -- get all cookies
    local user, session

    local cookie_obj, err = cookie:new()
    local fields = cookie_obj:get_all()
    if not fields then
        return false
    end

    local cookie_prefix = VeryNginxConfig.configs['cookie_prefix']

    user = fields[cookie_prefix .. '_user']
    session = fields[cookie_prefix .. '_session']

    if user == nil or session == nil then
        return false
    end

    for i, v in ipairs(VeryNginxConfig.configs['admin']) do
        if v["user"] == user and v["enable"] == true then
            if session == ngx.md5(encrypt_seed.get_seed() .. v["user"]) then
                return true
            else
                return false
            end
        end
    end

    return false
end


function _M.login()
    local args = util.get_request_args()

    for i, v in ipairs(VeryNginxConfig.configs['admin']) do
        if v['user'] == args['user'] and v['password'] == args["password"] and v['enable'] == true then
            local cookie_prefix = VeryNginxConfig.configs['cookie_prefix']
            local session = ngx.md5(encrypt_seed.get_seed() .. v['user'])

            local data = {}
            data['ret'] = 'success'
            data['cookies'] = {
                [cookie_prefix .. '_session'] = session,
                [cookie_prefix .. '_user'] = v['user'],
            }
            return json.encode(data)
        end
    end

    ngx.status = 400
    return json.encode({ ["ret"] = "failed", ["message"] = "Username and password not match" })
end

_M.route_table = {
    { ['method'] = "POST", ['auth'] = false, ["path"] = "/login", ['handle'] = _M.login },
    { ['method'] = "GET", ['auth'] = true, ["path"] = "/summary", ['handle'] = summary.report },
    { ['method'] = "GET", ['auth'] = true, ["path"] = "/status", ['handle'] = status.report },
    { ['method'] = "POST", ['auth'] = true, ["path"] = "/status/clear", ['handle'] = summary.clear },
    { ['method'] = "GET", ['auth'] = true, ["path"] = "/config", ['handle'] = VeryNginxConfig.report },
    { ['method'] = "POST", ['auth'] = true, ["path"] = "/config", ['handle'] = VeryNginxConfig.set },
    { ['method'] = "POST", ['auth'] = true, ["path"] = "/blackwhite/dump", ['handle'] = VeryNginxConfig.dump },
    { ['method'] = "POST", ['auth'] = true, ["path"] = "/blackwhite/list", ['handle'] = VeryNginxConfig.report_blackwhites },
    { ['method'] = "POST", ['auth'] = true, ["path"] = "/blackwhite/delete", ['handle'] = VeryNginxConfig.delete_blackwhites },
    { ['method'] = "POST", ['auth'] = true, ["path"] = "/blackwhite", ['handle'] = VeryNginxConfig.setBlackWhite },
    { ['method'] = "GET", ['auth'] = true, ["path"] = "/loadconfig", ['handle'] = VeryNginxConfig.load_from_file },
}



return _M
