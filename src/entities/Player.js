import Phaser from 'phaser';
import initAnimations from './anims/playerAnims';
import collidable from '../mixins/collidable';
import HealthBar from '../hud/HealthBar';
import anims from '../mixins/anims';
import Projectiles from '../attacks/Projectiles';
import MeleeWeapon from '../attacks/MeleeWeapon';
import { getTimestamp } from '../utils/functions';

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
        this.isSliding = false;
        this.bounceVelocity = 250;
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.lastDirection = Phaser.Physics.Arcade.FACING_RIGHT;

        this.body.setGravityY(this.gravity);
        this.body.setSize(20,36);
        this.setCollideWorldBounds(true);
        this.setOrigin(0.5, 1)
        this.projectiles = new Projectiles(this.scene, 'iceball-1');
        this.meleeWeapon = new MeleeWeapon(this.scene, 0, 0, 'sword-default');
        this.timeFromLastSwing = null;

        this.health = 100;
        this.hp = new HealthBar(
            this.scene, 
            this.scene.config.leftTopCorner.x + 5, 
            this.scene.config.leftTopCorner.y + 5, 
            2,
            this.health);   

        this.handleAttacks();
        this.handleMovements();
            
    }

    initEvents() {
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    }

    update() {
        if (this.hasBeenHit || this.isSliding) {return}
        const { left, right, space, up, down } = this.cursors;
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

        if (down.isDown) {
            this.play('slide', true);
          }

        if (this.isPlayingAnims('throw') || this.isPlayingAnims('slide')) {return;}

        if (onFloor) {
            this.jumpCount = 0;
        }

        onFloor ? 
            this.body.velocity.x !== 0 ?
                this.play('run', true) : this.play('idle', true) :
            this.play('jump', true);
    }

    bounceOff(source) {
        if (source.body) {
          this.body.touching.right ?
            this.setVelocityX(-this.bounceVelocity) :
            this.setVelocityX(this.bounceVelocity);
        } else {
          this.body.blocked.right ?
            this.setVelocityX(-this.bounceVelocity / 2) :
            this.setVelocityX(this.bounceVelocity / 2);
        }
    }

    takesHit(source) {
        if (this.hasBeenHit) {return}
        this.hasBeenHit = true;
        this.bounceOff(source);
        const hitAnim = this.playDamageTween();

        this.health -= source.damage || source.properties.damage || 0;
        this.hp.decrease(this.health);
        source.deliversHit && source.deliversHit(this);

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

    handleAttacks() {
        this.scene.input.keyboard.on('keydown-Q', () => {
            this.play('throw', true);
            this.projectiles.fireProjectile(this, 'iceball');
            
        
        })
        this.scene.input.keyboard.on('keydown-E', () => {

            if (this.timeFromLastSwing &&
                this.timeFromLastSwing + this.meleeWeapon.attackSpeed > getTimestamp()) {
                  return;
            }

            this.play('throw', true);
            this.meleeWeapon.swing(this);
            this.timeFromLastSwing = getTimestamp();
        })
    }

    handleMovements() {
        this.scene.input.keyboard.on('keydown-DOWN', () => {
        //   if (!this.body.onFloor()) { return; }
    
          this.body.setSize(this.width, this.height / 2);
          this.setOffset(0, this.height / 2);
          this.setVelocityX(0)
          this.play('slide', true);
          this.isSliding = true;
        })
    
        this.scene.input.keyboard.on('keyup-DOWN', () => {
          this.body.setSize(this.width, 38);
          this.setOffset(0, 0);
          this.isSliding = false;
        })
      }

}

export default Player;