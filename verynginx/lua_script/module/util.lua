-- -*- coding: utf-8 -*-
-- @Date    : 2016-02-29 
-- @Author  : Alexa (AlexaZhou@163.com)
-- @Link    : 
-- @Disc    : some tools

local json = require "json"

local _M = {}


function _M.string_replace(s, pattern, replace, times)
    local ret = nil
    while times >= 0 do
        times =  times - 1
        local s_start,s_stop = string.find(s, pattern , 1, true ) -- 1,true means plain searches from index 1
        if s_start ~= nil and s_stop ~= nil then 
            s = string.sub( s, 1, s_start-1 ) .. replace .. string.sub( s, s_stop+1 )
        end
    end
    return s
end

function _M.existed( list, value )
    for idx,item in ipairs( list ) do
        if item == value then
            return true
        end
    end
    return false
end

function _M.ngx_ctx_dump()
    local dump_str = json.encode( ngx.ctx )
    ngx.var.vn_ctx_dump = dump_str
end

function _M.ngx_ctx_load()
    
    if ngx.var.vn_ctx_dump == nil then
        return
    end

    local dump_str = ngx.var.vn_ctx_dump
    if dump_str ~= '' then
        ngx.ctx = json.decode( dump_str ) 
    end
end

function _M.get_request_args()
    local args = ngx.req.get_uri_args()
    local post_args, err = nil

    ngx.req.read_body()
    post_args, err = ngx.req.get_post_args()
    if post_args == nil then
        return args 
    end

    for k,v in pairs(post_args) do
        args[k] = v
    end

    return args
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

return _M
