const { assert } = require('chai');

const DaiToken = artifacts.require("DaiToken");
const DappToken = artifacts.require("DappToken");
const TokenFarm = artifacts.require("TokenFarm");

require('chai')
    .use(require('chai-as-promised'))
    .should()

// ETH doesnt operate with decimals so we use this function to make the digits human friendly
function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

    before(async () => {
        // Load Contracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // Transfer all Dapp tokens to farm (1 million)
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        // Send tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    })

    // Write tests here..
    describe('Mock DAI Deployment', async () => {
        it('Has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp Token Deployment', async () => {
        it('Has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'Raccoon Chain Token')
        })
    })

    describe('Token Farm Deployment', async () => {
        it('Has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'Raccoon Chain Token')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result

            // Check investor balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'))

            // Stake Mock DAI Tokens
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor } )
            await tokenFarm.stakeTokens(tokens('100'), { from: investor} )

            // Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')
            
            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'Token Farm Mock DAI balance correct after staking')
        
            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'Investor staking bnalance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status correct after staking')
            
            // Issue tokens
            await tokenFarm.issueTokens({ from: owner })

            // Check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Dapp Token wallet balance correct after issuance')
            
            // Ensure that only owner can issue tokens
            await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

            // Unstake Tokens
            await tokenFarm.unstakeTokens({ from: investor })

            // Check results after usntaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status correct after staking')
        })
    })
})
