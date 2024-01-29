// Copyright (c) HashiCorp, Inc.
// SPDX-License-Identifier: BUSL-1.1

package rabbitmq

import (
	"context"
	"testing"

	"github.com/hashicorp/vault/sdk/logical"
	"github.com/stretchr/testify/require"
)

func TestPki_RoleRead(t *testing.T) {

  var resp *logical.Response
	var err error

  // Create the role
	roleData := map[string]interface{}{}
	roleData["name"] = "testrole"
  roleData["tags"] = "tags"
  roleData["vhosts"] = "{ 'vhost': { 'configure': 'test', 'write':'test2', 'read':'test3' } }"
  roleData["vhost_topics"] = "{ 'vhost' : { 'exchanage-one' : { 'write':'test2', 'read':'test3' } } }"
  
	b, storage := CreateBackendWithStorage(t)

	roleReq := &logical.Request{
		Operation: logical.UpdateOperation,
		Path:      "role/testrole",
		Storage:   storage,
		Data:      roleData,
	}

	resp, err = b.HandleRequest(context.Background(), roleReq)
	if err != nil || (resp != nil && resp.IsError()) {
		t.Fatalf("bad [%d/%v] create: err: %v resp: %#v", index, testCase.Field, err, resp)
	}

	roleReq.Operation = logical.ReadOperation

	resp, err = b.HandleRequest(context.Background(), roleReq)
	if err != nil || (resp != nil && resp.IsError()) {
		t.Fatalf("bad: err: %v resp: %#v", err, resp)
	}

  // now verify the read succeeeded
  if resp == nil {
		t.Fatal("missing read response")
	}
	if resp.Data == nil {
		t.Fatalf("missing read data")
	}
  
	name, exists := resp.Data["name"]
	if !exists {
		t.Fatalf("missing name in response.Data")
	}
	tags, exists := resp.Data["tags"]
	if !exists {
		t.Fatalf("missing tags in response.Data")
	}
	vhosts, exists := resp.Data["vhosts"]
	if !exists {
		t.Fatalf("missing vhosts in response.Data")
	}
	vhost_topics, exists := resp.Data["vhost_topics"]
	if !exists {
		t.Fatalf("missing vhost_topics in response.Data")
	}
}

