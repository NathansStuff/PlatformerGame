import Phaser from 'phaser';
import initAnimations from './anims/playerAnims';
import collidable from '../mixins/collidable';
import HealthBar from '../hud/HealthBar';
import anims from '../mixins/anims';
import Projectiles from '../attacks/Projectiles';
import MeleeWeapon from '../attacks/MeleeWeapon';

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Mixins
        Object.assign(this, collidable);
        Object.assign(this, anims);

        this.init();
        this.initEvents();
        initAnimations(this.scene.anims);
    } 

    init() {
        this.gravity = 500;
        this.playerSpeed = 150;
        this.jumpCount = 0;
        this.consecutiveJumps = 1;
        this.hasBeenHit = false;
        this.bounceVelocity = 250;
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;

        this.body.setGravityY(this.gravity);
        this.body.setSize(20,36);
        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 1)
        this.projectiles = new Projectiles(this.scene);
        this.meleeWeapon = new MeleeWeapon(this.scene, 0, 0, 'sword-default');

        this.health = 100;
        this.hp = new HealthBar(
            this.scene, 
            this.scene.config.leftTopCorner.x + 5, 
            this.scene.config.leftTopCorner.y + 5, 
            2,
            this.health);
            
            this.scene.input.keyboard.on('keydown-Q', () => {
                this.play('throw', true);
                this.projectiles.fireProjectile(this);
                
            
            })

            this.scene.input.keyboard.on('keydown-E', () => {
                this.play('throw', true);
                this.meleeWeapon.swing(this);
            })
    }

    initEvents() {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    }

    update() {
        if (this.hasBeenHit) {return}
        const { left, right, space, up } = this.cursors;
        const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);
        const isUpJustDown = Phaser.Input.Keyboard.JustDown(up);
        const onFloor = this.body.onFloor();

        if (left.isDown) {
            this.setVelocityX(-this.playerSpeed)
            this.setFlipX(true);
            this.lastDirection = Phaser.Physics.Arcade.FACING_LEFT;
        } else if (right.isDown) {
            this.setVelocityX(this.playerSpeed);
            this.setFlipX(false);
            this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;
        } else {
            this.setVelocityX(0);
        }

        if ((isSpaceJustDown || isUpJustDown) && (onFloor || this.jumpCount < this.consecutiveJumps)) {
            this.setVelocityY(-this.playerSpeed * 1.8);
            this.jumpCount++;
        }

        if (this.isPlayingAnims('throw')) {return;}

        if (onFloor) {
            this.jumpCount = 0;
        }

        onFloor ? 
            this.body.velocity.x !== 0 ?
                this.play('run', true) : this.play('idle', true) :
            this.play('jump', true);
    }

    bounceOff() {
        this.body.touching.right ?
            this.setVelocity(-this.bounceVelocity) :
            this.setVelocity(this.bounceVelocity)
        
            setTimeout(() => this.setVelocityY(-this.bounceVelocity), 0);

    }

    takesHit(initiator) {
        if (this.hasBeenHit) {return}
        this.hasBeenHit = true;
        this.bounceOff();
        const hitAnim = this.playDamageTween();

        this.health -= initiator.damage;
        this.hp.decrease(this.health);

        this.scene.time.delayedCall(1000, () => {
            this.hasBeenHit = false,
            hitAnim.stop();
            this.clearTint();
        });
    }

    playDamageTween() {
        return this.scene.tweens.add({
            targets: this,
            duration: 100,
            repeat: -1,
            tint: 0xffffff, 
        });
    }

}

export default Player;