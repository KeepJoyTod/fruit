package com.fruit.management.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WechatSessionResponse(
        String openid,
        @JsonProperty("session_key") String sessionKey,
        String unionid,
        Integer errcode,
        String errmsg
) {
}
