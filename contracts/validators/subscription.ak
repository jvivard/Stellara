use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/address.{VerificationKey, from_verification_key}
use cardano/assets
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, ValidityRange,
}

pub type SubscriptionDatum {
  subscriber: VerificationKeyHash,
  creator: VerificationKeyHash,
  price: Int,
  period: Int,
  next_payment: Int,
}

pub type SubscriptionRedeemer {
  CollectPayment
  Cancel
}

validator subscription {
  spend(datum: Option<SubscriptionDatum>, redeemer: SubscriptionRedeemer, own_ref: OutputReference, transaction: Transaction) {
    expect Some(datum) = datum

    when redeemer is {
      CollectPayment -> {
        // 1. Check that the payment is due
        expect Finite(lower_bound) = transaction.validity_range.lower_bound.bound_type
        expect lower_bound >= datum.next_payment

        // 2. Check that the creator receives the payment
        let payment_made =
          list.any(
            transaction.outputs,
            fn(output) {
              assets.lovelace_of(output.value) >= datum.price &&
              output.address.payment_credential == VerificationKey(datum.creator)
            },
          )
        expect payment_made

        // 3. Find own input to get script address
        expect Some(own_input) =
          list.find(
            transaction.inputs,
            fn(input) { input.output_reference == own_ref },
          )
        let own_address = own_input.output.address

        // 4. Find continuing output (same address)
        expect Some(continuing_output) =
          list.find(
            transaction.outputs,
            fn(output) { output.address == own_address },
          )

        // 5. Verify continuing output datum
        expect InlineDatum(output_datum_data) = continuing_output.datum
        expect output_datum: SubscriptionDatum = output_datum_data

        and {
          output_datum.next_payment == datum.next_payment + datum.period,
          output_datum.subscriber == datum.subscriber,
          output_datum.creator == datum.creator,
          output_datum.price == datum.price,
          output_datum.period == datum.period,
          assets.lovelace_of(continuing_output.value) >= assets.lovelace_of(
            own_input.output.value,
          ),
        }
      }
      Cancel -> {
        // Check if signed by subscriber
        list.has(transaction.extra_signatories, datum.subscriber)
      }
    }
  }
}

// Mock hashes for testing
const subscriber_hash = #"00000000000000000000000000000000000000000000000000000001"
const creator_hash = #"00000000000000000000000000000000000000000000000000000002"

test success_collect_payment() {
  let datum = SubscriptionDatum {
    subscriber: subscriber_hash,
    creator: creator_hash,
    price: 1000000,
    period: 86400000, // 1 day
    next_payment: 1000,
  }

  let redeemer = CollectPayment

  let payment_output =
    Output {
      address: from_verification_key(creator_hash),
      value: assets.from_lovelace(1000000),
      datum: NoDatum,
      reference_script: None,
    }

  let continuing_output =
    Output {
      address: from_verification_key(subscriber_hash), // In test we use subscriber hash as script hash for simplicity, or we should match input.
      value: assets.from_lovelace(1000000),
      datum: InlineDatum(
        SubscriptionDatum {
          subscriber: subscriber_hash,
          creator: creator_hash,
          price: 1000000,
          period: 86400000,
          next_payment: 1000 + 86400000,
        },
      ),
      reference_script: None,
    }

  let tx =
    Transaction {
      ..transaction.placeholder,
      validity_range: interval.after(1001),
      outputs: [payment_output, continuing_output],
      inputs: [mock_input], // Crucial: The transaction must include the input being spent!
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/address.{VerificationKey, from_verification_key}
use cardano/assets
use cardano/transaction.{
  InlineDatum, Input, NoDatum, Output, OutputReference, Transaction, ValidityRange,
}

pub type SubscriptionDatum {
  subscriber: VerificationKeyHash,
  creator: VerificationKeyHash,
  price: Int,
  period: Int,
  next_payment: Int,
}

pub type SubscriptionRedeemer {
  CollectPayment
  Cancel
}

validator subscription {
  spend(datum: Option<SubscriptionDatum>, redeemer: SubscriptionRedeemer, own_ref: OutputReference, transaction: Transaction) {
    expect Some(datum) = datum

    when redeemer is {
      CollectPayment -> {
        // 1. Check that the payment is due
        expect Finite(lower_bound) = transaction.validity_range.lower_bound.bound_type
        expect lower_bound >= datum.next_payment

        // 2. Check that the creator receives the payment
        let payment_made =
          list.any(
            transaction.outputs,
            fn(output) {
              assets.lovelace_of(output.value) >= datum.price &&
              output.address.payment_credential == VerificationKey(datum.creator)
            },
          )
        expect payment_made

        // 3. Find own input to get script address
        expect Some(own_input) =
          list.find(
            transaction.inputs,
            fn(input) { input.output_reference == own_ref },
          )
        let own_address = own_input.output.address

        // 4. Find continuing output (same address)
        expect Some(continuing_output) =
          list.find(
            transaction.outputs,
            fn(output) { output.address == own_address },
          )

        // 5. Verify continuing output datum
        expect InlineDatum(output_datum_data) = continuing_output.datum
        expect output_datum: SubscriptionDatum = output_datum_data

        and {
          output_datum.next_payment == datum.next_payment + datum.period,
          output_datum.subscriber == datum.subscriber,
          output_datum.creator == datum.creator,
          output_datum.price == datum.price,
          output_datum.period == datum.period,
          assets.lovelace_of(continuing_output.value) >= assets.lovelace_of(
            own_input.output.value,
          ),
        }
      }
      Cancel -> {
        // Check if signed by subscriber
        list.has(transaction.extra_signatories, datum.subscriber)
      }
    }
  }
}

// Mock hashes for testing
const subscriber_hash = #"00000000000000000000000000000000000000000000000000000001"
const creator_hash = #"00000000000000000000000000000000000000000000000000000002"

test success_collect_payment() {
  let datum = SubscriptionDatum {
    subscriber: subscriber_hash,
    creator: creator_hash,
    price: 1000000,
    period: 86400000, // 1 day
    next_payment: 1000,
  }

  let redeemer = CollectPayment

  let payment_output =
    Output {
      address: from_verification_key(creator_hash),
      value: assets.from_lovelace(1000000),
      datum: NoDatum,
      reference_script: None,
    }

  let continuing_output =
    Output {
      address: from_verification_key(subscriber_hash), // In test we use subscriber hash as script hash for simplicity, or we should match input.
      value: assets.from_lovelace(1000000),
      datum: InlineDatum(
        SubscriptionDatum {
          subscriber: subscriber_hash,
          creator: creator_hash,
          price: 1000000,
          period: 86400000,
          next_payment: 1000 + 86400000,
        },
      ),
      reference_script: None,
    }

  let mock_input =
    Input {
      output_reference: OutputReference { transaction_id: #"0000000000000000000000000000000000000000000000000000000000000000", output_index: 0 },
      output: Output {
        address: from_verification_key(subscriber_hash), // Matches continuing output address in this mock
        value: assets.from_lovelace(1000000),
        datum: InlineDatum(datum),
        reference_script: None,
      },
    }

  let base_tx = transaction.placeholder
  let tx =
    Transaction {
      ..base_tx,
      validity_range: interval.after(1001),
      outputs: [payment_output, continuing_output],
      inputs: [mock_input],
    }

  // We need to make sure the transaction inputs include the one we are spending
  let placeholder_tx = Transaction { ..transaction.placeholder, inputs: [mock_input] }
  
  // We need to pass the correct OutputReference that matches the input we created
  subscription.spend(Some(datum), redeemer, mock_input.output_reference, tx)
}
