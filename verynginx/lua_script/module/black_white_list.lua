-- -*- coding: utf-8 -*-
-- @Date    : 2016-01-02 00:46
-- @Author  : Alexa (AlexaZhou@163.com)
-- @Link    : 
-- @Disc    : filter request'uri maybe attack

local _M = {}

local VeryNginxConfig = require "VeryNginxConfig"
local request_tester = require "request_tester"

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

    if VeryNginxConfig.configs["black_white_list_enable"] ~= true then
        return
    end
    local cip = _M.checkIp();
    local matcher_list = VeryNginxConfig.configs['matcher']
    local response_list = VeryNginxConfig.configs['response']
    local response = nil
    for i, rule in ipairs(VeryNginxConfig.configs["black_white_list"]) do
        if cip == rule['ip'] then
            local enable = rule['enable']
            local matcher = matcher_list[rule['matcher']]
            if enable == true and request_tester.test(matcher) == true then
                local action = rule['action']

                if action == 'accept' then
                    return
                else
                    if rule['response'] ~= nil then
                        ngx.status = tonumber(rule['code'])
                        response = response_list[rule['response']]
                        if response ~= nil then
                            ngx.header.content_type = response['content_type']
                            ngx.say(response['body'])
                            ngx.exit(ngx.HTTP_OK)
                        end
                    else
                        ngx.exit(tonumber(rule['code']))
                    end
                end
            end
        end
    end
end

return _M
