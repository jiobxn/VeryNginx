-- -*- coding: utf-8 -*-
-- @Date    : 2016-04-20 23:13
-- @Author  : Alexa (AlexaZhou@163.com)
-- @Link    : 
-- @Disc    : request frequency limit
local logger = require( "logger" )
local log = logger:new('info', '/usr/local/openresty/nginx/logs/frequency.log' )

local _M = {}


local VeryNginxConfig = require "VeryNginxConfig"
local request_tester = require "request_tester"
local util = require "util"

local limit_dict = ngx.shared.frequency_limit
local ngx_vars = ngx.var  
function _M.filter()

    if VeryNginxConfig.configs["frequency_limit_enable"] ~= true then
        return
    end

    local matcher_list = VeryNginxConfig.configs['matcher']
    local response_list = VeryNginxConfig.configs['response']
    local response = nil

    for i, rule in ipairs( VeryNginxConfig.configs["frequency_limit_rule"] ) do
        local enable = rule['enable']
        local matcher = matcher_list[ rule['matcher'] ] 
        if enable == true and request_tester.test( matcher ) == true then
            local remote_addr = ngx.var.remote_addr
			if remote_addr == nil then
				remote_addr = "-"
			end
            local key = i 
            if util.existed( rule['separate'], 'ip' ) then
                key = key..'-'.. ngx.var.remote_addr
            end

            if util.existed( rule['separate'], 'uri' ) then
                key = key..'-'..ngx.var.uri
            end

            local time = rule['time']
            local count = rule['count']
            local code = rule['code']

            --ngx.log(ngx.STDERR,'-----');
            --ngx.log(ngx.STDERR,key);
            
            local count_now = limit_dict:get( key )
            --ngx.log(ngx.STDERR, tonumber(count_now) );
            
            if count_now == nil then
                limit_dict:set( key, 1, tonumber(time) )
                count_now = 0
            end
            limit_dict:incr( key, 1 )
            if count_now > tonumber(count) then

				local time_local = ngx.var.time_local
				if time_local == nil then
					time_local = "-"
				end
				local status = ngx.var.status
				local request = ngx.var.request
				if request == nil then
					request = "-"
				end
				local body_bytes_sent = ngx.var.body_bytes_sent
				local http_referer = ngx.var.http_referer
				if http_referer == nil then
					http_referer = "-"
				end
				
				local remote_user = ngx.var.remote_user
				if remote_user == nil then
					remote_user = "-"
				end
				local http_user_agent = ngx.var.http_user_agent
				if http_user_agent == nil then
					http_user_agent = "-"
				end
				local http_x_forwarded_for = ngx.var.http_x_forwarded_for
				if http_x_forwarded_for == nil then
					http_x_forwarded_for = "-"
				end
				log:info(remote_addr .. ' - ' .. remote_user .. ' ['.. time_local ..'] "' .. request .. '" ' .. status .. ' ' .. body_bytes_sent .. ' "' .. http_referer .. '" "' .. http_user_agent .. '" "' .. http_x_forwarded_for .. '" "' .. key ..'" ' .. count_now)
                if rule['response'] ~= nil then
                    ngx.status = tonumber( rule['code'] )
                    response = response_list[rule['response']]
                    if response ~= nil then
                        ngx.header.content_type = response['content_type']
                        ngx.say( response['body'] )
                    end
                    ngx.exit( ngx.HTTP_OK )
                else
					ngx.exit( tonumber( rule['code'] ) )
                end
            end
            return
        end
    end
end

return _M
